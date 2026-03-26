package com.agroconnect.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
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
import com.agroconnect.models.Order
import com.agroconnect.models.OrderItem
import com.agroconnect.ui.navigation.Screen
import io.github.jan.supabase.gotrue.auth
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(navController: NavController) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var cartItems by remember { mutableStateOf<List<CartItemWithDetails>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var placingOrder by remember { mutableStateOf(false) }
    var orderSuccess by remember { mutableStateOf(false) }

    val currentUserId = remember { SupabaseClient.client.auth.currentUserOrNull()?.id }
    val inrFormat = remember { NumberFormat.getNumberInstance(Locale("en", "IN")) }

    LaunchedEffect(Unit) {
        if (currentUserId == null) return@LaunchedEffect
        loading = true
        cartItems = AgroRepository.getCartItems(currentUserId)
        loading = false
    }

    val cartTotal = remember(cartItems) {
        cartItems.sumOf { it.cartItem.quantity * it.listing.listedPrice }
    }

    if (orderSuccess) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Filled.CheckCircle, null, modifier = Modifier.size(80.dp), tint = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(16.dp))
                Text("Order Placed Successfully!", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text("You can coordinate payment directly with the seller.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(24.dp))
                Button(onClick = { navController.navigate(Screen.Orders.route) { popUpTo(Screen.Dashboard.route) } }) {
                    Text("View My Orders")
                }
            }
        }
        return
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
                Text("Nothing to checkout")
            }
            return
        }

        LazyColumn(
            modifier = Modifier.weight(1f).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text("Order Summary", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            }

            items(cartItems) { item ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(if (item.listing.itemType == "CROP") item.cropName else "Equipment", fontWeight = FontWeight.SemiBold)
                        Text("${item.cartItem.quantity} ${item.listing.unitOfMeasure} × ₹${inrFormat.format(item.listing.listedPrice)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text("₹${inrFormat.format(item.cartItem.quantity * item.listing.listedPrice)}", fontWeight = FontWeight.Medium)
                }
                Divider(modifier = Modifier.padding(top = 8.dp))
            }

            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    modifier = Modifier.fillMaxWidth().padding(top = 16.dp)
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Payment Method", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onPrimaryContainer)
                        Spacer(Modifier.height(4.dp))
                        Text("Pay directly to seller (Offline)", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                }
            }
        }

        Surface(
            shadowElevation = 8.dp,
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Total to Pay", style = MaterialTheme.typography.titleMedium)
                    Text("₹${inrFormat.format(cartTotal)}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = {
                        if (currentUserId == null) return@Button
                        scope.launch {
                            placingOrder = true
                            
                            val order = Order(
                                buyerUserId = currentUserId,
                                totalAmount = cartTotal,
                                paymentStatus = "PENDING",
                                orderStatus = "PLACED"
                            )
                            
                            val orderItems = cartItems.map { c ->
                                OrderItem(
                                    orderId = 0, // Set in repository
                                    listingId = c.cartItem.listingId,
                                    quantity = c.cartItem.quantity,
                                    pricePerUnit = c.listing.listedPrice
                                )
                            }
                            
                            val success = AgroRepository.createOrder(order, orderItems)
                            if (success) {
                                AgroRepository.clearCart(currentUserId)
                                orderSuccess = true
                            } else {
                                Toast.makeText(context, "Failed to place order. Try again.", Toast.LENGTH_SHORT).show()
                            }
                            placingOrder = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    enabled = !placingOrder,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    if (placingOrder) {
                        CircularProgressIndicator(Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                    } else {
                        Text("Place Order", fontSize = MaterialTheme.typography.titleMedium.fontSize)
                    }
                }
            }
        }
    }
}
