package com.agroconnect.ui.screens

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.compose.foundation.clickable
import com.agroconnect.data.AgroRepository
import com.agroconnect.data.SupabaseClient
import com.agroconnect.models.Crop
import com.agroconnect.models.Listing
import com.agroconnect.ui.navigation.Screen
import com.agroconnect.ui.theme.*
import io.github.jan.supabase.gotrue.auth
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

private val inrFormat = NumberFormat.getNumberInstance(Locale("en", "IN"))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarketplaceScreen(navController: NavController) {
    val scope = rememberCoroutineScope()
    var listings by remember { mutableStateOf<List<Listing>>(emptyList()) }
    var crops by remember { mutableStateOf<List<Crop>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var search by remember { mutableStateOf("") }
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Browse", "My Listings")

    val currentUserId = remember {
        SupabaseClient.client.auth.currentUserOrNull()?.id
    }

    fun loadData() {
        scope.launch {
            loading = true
            try {
                crops = AgroRepository.getCrops()
                listings = if (selectedTab == 0) {
                    AgroRepository.getListings()
                } else {
                    currentUserId?.let { AgroRepository.getMyListings(it) } ?: emptyList()
                }
            } catch (e: Exception) {
                Log.e("AgroConnect", "MarketplaceScreen failed: ${e.message}", e)
            }
            loading = false
        }
    }

    LaunchedEffect(selectedTab) {
        loadData()
    }

    val cropMap = remember(crops) { crops.associate { it.cropId to it.cropNameEn } }

    val filtered = listings.filter {
        if (search.isBlank()) true
        else {
            val cropName = cropMap[it.cropId] ?: ""
            cropName.contains(search, ignoreCase = true) ||
            it.itemType.contains(search, ignoreCase = true)
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Marketplace", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            
            // Cart badge
            var cartCount by remember { mutableIntStateOf(0) }
            LaunchedEffect(currentUserId) {
                if (currentUserId != null) {
                    try {
                        val count = AgroRepository.getCartItems(currentUserId).size
                        cartCount = count
                    } catch (e: Exception) {}
                }
            }
            
            BadgedBox(
                badge = {
                    if (cartCount > 0) {
                        Badge { Text("$cartCount") }
                    }
                }
            ) {
                IconButton(onClick = { navController.navigate(Screen.Cart.route) }) {
                    Icon(Icons.Filled.ShoppingCart, contentDescription = "Cart")
                }
            }
        }

        // Tab Row
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text(title) }
                )
            }
        }

        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
            return
        }

        Box(Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 16.dp),
            ) {
                // Search
                item {
                    OutlinedTextField(
                        value = search,
                        onValueChange = { search = it },
                        placeholder = { Text("Search crops, equipment…") },
                        leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true,
                    )
                }

                item {
                    Text(
                        "🛒 ${filtered.size} listings found",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (filtered.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        ) {
                            Column(
                                modifier = Modifier.padding(32.dp).fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Icon(
                                    Icons.Filled.Storefront,
                                    contentDescription = null,
                                    modifier = Modifier.size(48.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                Spacer(Modifier.height(12.dp))
                                Text(
                                    if (selectedTab == 0) "No listings yet" else "You haven't listed anything",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold,
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    if (selectedTab == 0) "Be the first to sell your produce!"
                                    else "Tap + to create your first listing",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }

                items(filtered) { listing ->
                    val cropName = cropMap[listing.cropId] ?: "Equipment"
                    val emoji = when (listing.cropId) {
                        1 -> "🌾"; 2 -> "🍚"; 4 -> "🌿"; 7 -> "🧅"; 8 -> "🍅"; 9 -> "🥔"; else -> "📦"
                    }
                    val isOwn = listing.sellerUserId == currentUserId

                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier.clickable { navController.navigate(Screen.ListingDetail.createRoute(listing.listingId)) }
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.Top) {
                                Text(emoji, style = MaterialTheme.typography.headlineMedium)
                                Spacer(Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        if (listing.itemType == "CROP") cropName else "Equipment",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                    )
                                    Spacer(Modifier.height(2.dp))
                                    Text(
                                        "${listing.quantity} ${listing.unitOfMeasure}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        "₹${inrFormat.format(listing.listedPrice)}",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Green800,
                                    )
                                    Text(
                                        "per ${listing.unitOfMeasure}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }

                            Spacer(Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                            ) {
                                // Status badge
                                Box(
                                    modifier = Modifier
                                        .height(24.dp)
                                        .background(
                                            color = when (listing.listingStatus) {
                                                "ACTIVE" -> Success.copy(alpha = 0.12f)
                                                "SOLD" -> Danger.copy(alpha = 0.12f)
                                                else -> Info.copy(alpha = 0.12f)
                                            },
                                            shape = RoundedCornerShape(12.dp),
                                        )
                                        .padding(horizontal = 10.dp),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Text(
                                        listing.listingStatus,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = when(listing.listingStatus) {
                                            "ACTIVE" -> Success; "SOLD" -> Danger; else -> Info
                                        },
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                }

                                // Type badge
                                Box(
                                    modifier = Modifier
                                        .height(24.dp)
                                        .background(
                                            color = MaterialTheme.colorScheme.surfaceVariant,
                                            shape = RoundedCornerShape(12.dp),
                                        )
                                        .padding(horizontal = 10.dp),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Text(
                                        listing.itemType,
                                        style = MaterialTheme.typography.labelSmall,
                                    )
                                }

                                Spacer(Modifier.weight(1f))

                                if (isOwn && listing.listingStatus == "ACTIVE") {
                                    TextButton(
                                        onClick = {
                                            scope.launch {
                                                AgroRepository.updateListingStatus(listing.listingId, "SOLD")
                                                loadData()
                                            }
                                        },
                                        contentPadding = PaddingValues(horizontal = 8.dp),
                                    ) {
                                        Text("Mark Sold", style = MaterialTheme.typography.labelSmall)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // FAB to create listing
            FloatingActionButton(
                onClick = { navController.navigate(Screen.CreateListing.route) },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp),
                containerColor = MaterialTheme.colorScheme.primary,
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Create Listing")
            }
        }
    }
}
