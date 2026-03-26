package com.agroconnect.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.agroconnect.data.AgroRepository
import com.agroconnect.data.SupabaseClient
import com.agroconnect.models.CartItemWithDetails
import com.agroconnect.ui.navigation.Screen
import io.github.jan.supabase.gotrue.auth
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(navController: NavController) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var cartItems by remember { mutableStateOf<List<CartItemWithDetails>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    val currentUserId = remember { SupabaseClient.client.auth.currentUserOrNull()?.id }
    val inrFormat = remember { NumberFormat.getNumberInstance(Locale("en", "IN")) }

    fun loadCart() {
        if (currentUserId == null) return
        scope.launch {
            loading = true
            cartItems = AgroRepository.getCartItems(currentUserId)
            loading = false
        }
    }

    LaunchedEffect(Unit) {
        loadCart()
    }

    val cartTotal = remember(cartItems) {
        cartItems.sumOf { it.cartItem.quantity * it.listing.listedPrice }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
            return
        }

        if (cartItems.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Filled.ShoppingCart, null, modifier = Modifier.size(64.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(16.dp))
                    Text("Your cart is empty", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { navController.popBackStack() }) {
                        Text("Continue Shopping")
                    }
                }
            }
            return
        }

        LazyColumn(
            modifier = Modifier.weight(1f).padding(horizontal = 16.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(cartItems) { item ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp).fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val emoji = when (item.listing.cropId) {
                            1 -> "🌾"; 2 -> "🍚"; 4 -> "🌿"; 7 -> "🧅"; 8 -> "🍅"; 9 -> "🥔"; else -> "📦"
                        }
                        Text(emoji, style = MaterialTheme.typography.displaySmall)
                        Spacer(Modifier.width(12.dp))
                        
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                if (item.listing.itemType == "CROP") item.cropName else "Equipment",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                "₹${inrFormat.format(item.listing.listedPrice)} / ${item.listing.unitOfMeasure}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            
                            Spacer(Modifier.height(8.dp))
                            
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                // Qty controls
                                IconButton(
                                    onClick = {
                                        if (item.cartItem.quantity > 1) {
                                            scope.launch {
                                                AgroRepository.updateCartQuantity(item.cartItem.cartId, item.cartItem.quantity - 1)
                                                loadCart()
                                            }
                                        }
                                    },
                                    modifier = Modifier.size(32.dp).background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                                ) { Icon(Icons.Filled.Remove, null, modifier = Modifier.size(16.dp)) }
                                
                                Text(
                                    "${item.cartItem.quantity}",
                                    modifier = Modifier.padding(horizontal = 16.dp),
                                    style = MaterialTheme.typography.titleMedium
                                )
                                
                                val maxQty = item.listing.quantity
                                IconButton(
                                    onClick = {
                                        if (item.cartItem.quantity < maxQty) {
                                            scope.launch {
                                                AgroRepository.updateCartQuantity(item.cartItem.cartId, item.cartItem.quantity + 1)
                                                loadCart()
                                            }
                                        } else {
                                            Toast.makeText(context, "Max available limit reached", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    modifier = Modifier.size(32.dp).background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(8.dp))
                                ) { Icon(Icons.Filled.Add, null, modifier = Modifier.size(16.dp)) }
                            }
                        }
                        
                        Column(horizontalAlignment = Alignment.End) {
                            val itemTotal = item.cartItem.quantity * item.listing.listedPrice
                            Text("₹${inrFormat.format(itemTotal)}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.height(16.dp))
                            IconButton(onClick = {
                                scope.launch {
                                    AgroRepository.removeFromCart(item.cartItem.cartId)
                                    loadCart()
                                }
                            }) { Icon(Icons.Filled.Delete, null, tint = MaterialTheme.colorScheme.error) }
                        }
                    }
                }
            }
        }
    }

    // Bottom checkout bar
    if (!loading && cartItems.isNotEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            Surface(
                shadowElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Total Amount", style = MaterialTheme.typography.labelMedium)
                        Text("₹${inrFormat.format(cartTotal)}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                    Button(
                        onClick = { navController.navigate(Screen.Checkout.route) },
                        contentPadding = PaddingValues(horizontal = 32.dp, vertical = 12.dp)
                    ) {
                        Text("Checkout", fontSize = MaterialTheme.typography.titleMedium.fontSize)
                    }
                }
            }
        }
    }
}
