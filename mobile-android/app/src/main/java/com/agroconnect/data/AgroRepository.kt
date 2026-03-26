package com.agroconnect.data

import android.content.Context
import android.util.Log
import com.agroconnect.db.*
import com.agroconnect.models.*
import io.github.jan.supabase.functions.functions
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import io.ktor.client.call.*
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

private const val TAG = "AgroRepository"

object AgroRepository {

    private val client = SupabaseClient.client
    private val json = Json { ignoreUnknownKeys = true }
    private var db: AppDatabase? = null

    fun init(context: Context) {
        if (db == null) {
            db = AppDatabase.getDatabase(context)
        }
    }

    // ─── Crops ───
    suspend fun getCrops(): List<Crop> {
        Log.d(TAG, "getCrops() → querying c_crops...")
        val result = client.postgrest["c_crops"]
            .select()
            .decodeList<Crop>()
        Log.d(TAG, "getCrops() → got ${result.size} rows")
        return result
    }

    // ─── Mandis ───
    suspend fun getMandis(userLat: Double? = null, userLon: Double? = null): List<Mandi> {
        Log.d(TAG, "getMandis() → querying c_mandis...")
        val localMandis = db?.mandiDao()?.getAllMandis()?.firstOrNull()?.map { it.toModel() } ?: emptyList()
        
        val result = try {
            val remote = client.postgrest["c_mandis"].select().decodeList<Mandi>()
            db?.mandiDao()?.insertAll(remote.map { MandiEntity.fromModel(it) })
            remote
        } catch (e: Exception) {
            Log.e(TAG, "getMandis network failed, using local", e)
            localMandis
        }
        
        return if (userLat != null && userLon != null) {
            result.sortedBy { mandi ->
                calculateDistance(userLat, userLon, mandi.latitude, mandi.longitude)
            }
        } else {
            result
        }
    }

    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371 // Radius of the earth in km
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return r * c
    }

    // ─── Prices ───
    suspend fun getLatestPrices(cropId: Int, limit: Int = 2): List<DailyMarketPrice> {
        Log.d(TAG, "getLatestPrices(cropId=$cropId, limit=$limit) → querying...")
        val result = client.postgrest["p_daily_market_prices"]
            .select {
                filter { eq("crop_id", cropId) }
                order("date", Order.DESCENDING)
                limit(limit.toLong())
            }
            .decodeList<DailyMarketPrice>()
        Log.d(TAG, "getLatestPrices() → got ${result.size} rows")
        return result
    }

    suspend fun getPriceHistory(cropId: Int, mandiId: Int, limit: Int = 30): List<DailyMarketPrice> {
        Log.d(TAG, "getPriceHistory(cropId=$cropId, mandiId=$mandiId) → querying...")
        val result = client.postgrest["p_daily_market_prices"]
            .select {
                filter {
                    eq("crop_id", cropId)
                    eq("mandi_id", mandiId)
                }
                order("date", Order.ASCENDING)
                limit(limit.toLong())
            }
            .decodeList<DailyMarketPrice>()
        Log.d(TAG, "getPriceHistory() → got ${result.size} rows")
        return result
    }

    // ─── Advisories ───
    suspend fun getAdvisories(type: String? = null): List<Advisory> {
        Log.d(TAG, "getAdvisories(type=$type) → querying a_advisories...")
        val localAdvisories = db?.advisoryDao()?.getAllAdvisories()?.firstOrNull()?.map { it.toModel() } ?: emptyList()
        
        val allAdvisories = try {
            val remote = client.postgrest["a_advisories"].select {
                order("urgency", Order.ASCENDING)
            }.decodeList<Advisory>()
            db?.advisoryDao()?.insertAll(remote.map { AdvisoryEntity.fromModel(it) })
            remote
        } catch (e: Exception) {
            Log.e(TAG, "getAdvisories network failed, using local", e)
            localAdvisories
        }
        
        return if (type != null) {
            allAdvisories.filter { it.advisoryType == type }
        } else {
            allAdvisories
        }
    }

    // ─── Predictions (Edge Function) ───
    suspend fun getPredictions(cropId: Int, mandiId: Int): PredictionResponse {
        Log.d(TAG, "getPredictions(cropId=$cropId, mandiId=$mandiId) → invoking edge function...")
        return try {
            val body = buildJsonObject {
                put("crop_id", cropId)
                put("mandi_id", mandiId)
            }
            val response = client.functions.invoke(
                function = "predict-prices",
                body = body,
            )
            val bodyStr = response.body<String>()
            val prediction = json.decodeFromString<PredictionResponse>(bodyStr)
            db?.predictionDao()?.insertPrediction(PredictionEntity.fromModel(prediction, cropId, mandiId))
            prediction
        } catch (e: Exception) {
            Log.e(TAG, "getPredictions network failed", e)
            val local = db?.predictionDao()?.getPrediction(cropId, mandiId)?.firstOrNull()?.toModel()
            local ?: throw e
        }
    }

    // ─── Weather (Edge Function) ───
    suspend fun getWeather(lat: Double, lon: Double): WeatherResponse {
        Log.d(TAG, "getWeather(lat=$lat, lon=$lon) → invoking edge function...")
        return try {
            val response = client.functions.invoke(
                function = "weather-proxy",
                body = buildJsonObject {
                    put("lat", lat)
                    put("lon", lon)
                },
            )
            val bodyStr = response.body<String>()
            val weather = json.decodeFromString<WeatherResponse>(bodyStr)
            db?.weatherDao()?.insertWeather(WeatherEntity.fromModel(weather))
            weather
        } catch (e: Exception) {
            Log.e(TAG, "getWeather network failed", e)
            throw e
        }
    }

    // ─── Profile ───
    suspend fun getUserProfile(userId: String): UserProfile? {
        Log.d(TAG, "getUserProfile(userId=$userId) → querying u_users...")
        return try {
            client.postgrest["u_users"]
                .select {
                    filter { eq("user_id", userId) }
                    limit(1)
                }
                .decodeSingleOrNull<UserProfile>()
        } catch (e: Exception) {
            Log.e(TAG, "getUserProfile error", e)
            null
        }
    }

    suspend fun getFarmerProfile(userId: String): FarmerProfile? {
        return try {
            client.postgrest["u_farmer_profile"]
                .select {
                    filter { eq("user_id", userId) }
                    limit(1)
                }
                .decodeSingleOrNull<FarmerProfile>()
        } catch (e: Exception) {
            Log.e(TAG, "getFarmerProfile error", e)
            null
        }
    }

    suspend fun getBuyerProfile(userId: String): BuyerProfile? {
        return try {
            client.postgrest["u_buyer_profile"]
                .select {
                    filter { eq("user_id", userId) }
                    limit(1)
                }
                .decodeSingleOrNull<BuyerProfile>()
        } catch (e: Exception) {
            Log.e(TAG, "getBuyerProfile error", e)
            null
        }
    }

    suspend fun updateFarmerProfile(profile: FarmerProfile) {
        client.postgrest["u_farmer_profile"].upsert(profile) {
            filter { eq("user_id", profile.userId) }
        }
    }

    suspend fun updateBuyerProfile(profile: BuyerProfile) {
        client.postgrest["u_buyer_profile"].upsert(profile) {
            filter { eq("user_id", profile.userId) }
        }
    }

    suspend fun syncUserLocation(userId: String, lat: Double, lon: Double) {
        Log.d(TAG, "syncUserLocation(userId=$userId, lat=$lat, lon=$lon)")
        try {
            // Check if farmer or buyer
            val farmer = getFarmerProfile(userId)
            if (farmer != null) {
                updateFarmerProfile(farmer.copy(lat = lat, lon = lon))
            } else {
                val buyer = getBuyerProfile(userId)
                if (buyer != null) {
                    updateBuyerProfile(buyer.copy(lat = lat, lon = lon))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "syncUserLocation failed", e)
        }
    }

    // ─── Marketplace Listings ───
    suspend fun getListings(): List<Listing> {
        Log.d(TAG, "getListings() → querying m_listings...")
        return try {
            client.postgrest["m_listings"]
                .select {
                    filter { eq("listing_status", "ACTIVE") }
                    order("created_at", Order.DESCENDING)
                }
                .decodeList<Listing>()
        } catch (e: Exception) {
            Log.e(TAG, "getListings failed", e)
            emptyList()
        }
    }

    suspend fun getMyListings(userId: String): List<Listing> {
        Log.d(TAG, "getMyListings(userId=$userId) → querying...")
        return try {
            client.postgrest["m_listings"]
                .select {
                    filter { eq("seller_user_id", userId) }
                    order("created_at", Order.DESCENDING)
                }
                .decodeList<Listing>()
        } catch (e: Exception) {
            Log.e(TAG, "getMyListings failed", e)
            emptyList()
        }
    }

    suspend fun createListing(listing: Listing): Boolean {
        Log.d(TAG, "createListing() → inserting into m_listings...")
        return try {
            client.postgrest["m_listings"].insert(listing)
            true
        } catch (e: Exception) {
            Log.e(TAG, "createListing failed", e)
            false
        }
    }

    suspend fun updateListingStatus(listingId: Long, status: String) {
        try {
            client.postgrest["m_listings"].update({
                set("listing_status", status)
            }) {
                filter { eq("listing_id", listingId) }
            }
        } catch (e: Exception) {
            Log.e(TAG, "updateListingStatus failed", e)
        }
    }

    suspend fun deleteListing(listingId: Long) {
        try {
            client.postgrest["m_listings"].delete {
                filter { eq("listing_id", listingId) }
            }
        } catch (e: Exception) {
            Log.e(TAG, "deleteListing failed", e)
        }
    }

    suspend fun createTransaction(tx: MarketTransaction): Boolean {
        return try {
            client.postgrest["m_transactions"].insert(tx)
            true
        } catch (e: Exception) {
            Log.e(TAG, "createTransaction failed", e)
            false
        }
    }

    // ─── Cart ───
    suspend fun addToCart(cartItem: com.agroconnect.models.CartItem): Boolean {
        return try {
            client.postgrest["m_cart_items"].insert(cartItem)
            true
        } catch (e: Exception) {
            Log.e(TAG, "addToCart failed", e)
            false
        }
    }

    suspend fun getCartItems(userId: String): List<com.agroconnect.models.CartItemWithDetails> {
        return try {
            // First fetch the raw cart items
            val cartItems = client.postgrest["m_cart_items"]
                .select {
                    filter { eq("user_id", userId) }
                    order("added_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
                }
                .decodeList<com.agroconnect.models.CartItem>()
                
            if (cartItems.isEmpty()) return emptyList()
            
            // Then fetch the associated listings
            val listingIds = cartItems.map { it.listingId }
            val listings = client.postgrest["m_listings"]
                .select { filter { isIn("listing_id", listingIds) } }
                .decodeList<Listing>()
                .associateBy { it.listingId }
                
            val crops = getCrops().associateBy { it.cropId }
            
            cartItems.mapNotNull { item ->
                val listing = listings[item.listingId] ?: return@mapNotNull null
                val cropName = crops[listing.cropId]?.cropNameEn ?: "Equipment"
                com.agroconnect.models.CartItemWithDetails(item, listing, cropName)
            }
        } catch (e: Exception) {
            Log.e(TAG, "getCartItems failed", e)
            emptyList()
        }
    }

    suspend fun updateCartQuantity(cartId: Long, newQuantity: Double) {
        try {
            client.postgrest["m_cart_items"].update({
                set("quantity", newQuantity)
            }) {
                filter { eq("cart_id", cartId) }
            }
        } catch (e: Exception) {
            Log.e(TAG, "updateCartQuantity failed", e)
        }
    }

    suspend fun removeFromCart(cartId: Long) {
        try {
            client.postgrest["m_cart_items"].delete {
                filter { eq("cart_id", cartId) }
            }
        } catch (e: Exception) {
            Log.e(TAG, "removeFromCart failed", e)
        }
    }

    suspend fun clearCart(userId: String) {
        try {
            client.postgrest["m_cart_items"].delete {
                filter { eq("user_id", userId) }
            }
        } catch (e: Exception) {
            Log.e(TAG, "clearCart failed", e)
        }
    }

    // ─── Orders ───
    suspend fun createOrder(order: com.agroconnect.models.Order, items: List<com.agroconnect.models.OrderItem>): Boolean {
        return try {
            val placedOrder = client.postgrest["m_orders"]
                .insert(order)
                .decodeSingle<com.agroconnect.models.Order>()
            
            val orderItems = items.map { it.copy(orderId = placedOrder.orderId) }
            
            client.postgrest["m_order_items"].insert(orderItems)
            true
        } catch (e: Exception) {
            Log.e(TAG, "createOrder failed", e)
            false
        }
    }

    suspend fun getMyOrders(userId: String): List<com.agroconnect.models.Order> {
         return try {
            client.postgrest["m_orders"]
                .select {
                    filter { eq("buyer_user_id", userId) }
                    order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
                }
                .decodeList<com.agroconnect.models.Order>()
        } catch (e: Exception) {
            Log.e(TAG, "getMyOrders failed", e)
            emptyList()
        }
    }
}
