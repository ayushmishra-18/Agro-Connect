package com.agroconnect.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.agroconnect.data.AgroRepository
import com.agroconnect.data.SupabaseClient
import com.agroconnect.models.Order
import com.agroconnect.ui.theme.Danger
import com.agroconnect.ui.theme.Info
import com.agroconnect.ui.theme.Success
import io.github.jan.supabase.gotrue.auth
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(navController: NavController) {
    val scope = rememberCoroutineScope()
    var orders by remember { mutableStateOf<List<Order>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    val currentUserId = remember { SupabaseClient.client.auth.currentUserOrNull()?.id }
    val inrFormat = remember { NumberFormat.getNumberInstance(Locale("en", "IN")) }
    
    val inputFormat = remember { SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).apply { timeZone = TimeZone.getTimeZone("UTC") } }
    val outputFormat = remember { SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()) }

    LaunchedEffect(Unit) {
        if (currentUserId == null) return@LaunchedEffect
        loading = true
        orders = AgroRepository.getMyOrders(currentUserId)
        loading = false
    }

    Column(modifier = Modifier.fillMaxSize()) {
        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
            return
        }

        if (orders.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Filled.Receipt, null, modifier = Modifier.size(64.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(16.dp))
                    Text("No orders yet", style = MaterialTheme.typography.titleMedium)
                }
            }
            return
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(orders) { order ->
                var formattedDate = "Unknown Date"
                if (order.createdAt != null) {
                    try {
                        // Truncate milliseconds and timezone "Z" if present
                        val cleanDate = order.createdAt.take(19)
                        val date = inputFormat.parse(cleanDate)
                        if (date != null) formattedDate = outputFormat.format(date)
                    } catch (e: Exception) { }
                }
                
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Order #${order.orderId}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text("₹${inrFormat.format(order.totalAmount)}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                        
                        Spacer(Modifier.height(4.dp))
                        Text(formattedDate, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        
                        Spacer(Modifier.height(12.dp))
                        
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Status badge
                            Box(
                                modifier = Modifier
                                    .height(24.dp)
                                    .background(
                                        color = when (order.orderStatus) {
                                            "DELIVERED" -> Success.copy(alpha = 0.12f)
                                            "CANCELLED" -> Danger.copy(alpha = 0.12f)
                                            else -> Info.copy(alpha = 0.12f)
                                        },
                                        shape = RoundedCornerShape(12.dp),
                                    )
                                    .padding(horizontal = 10.dp),
                                    contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    order.orderStatus,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = when(order.orderStatus) {
                                        "DELIVERED" -> Success; "CANCELLED" -> Danger; else -> Info
                                    },
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                            
                            // Payment badge
                            Box(
                                modifier = Modifier
                                    .height(24.dp)
                                    .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
                                    .padding(horizontal = 10.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    "Payment: ${order.paymentStatus}",
                                    style = MaterialTheme.typography.labelSmall,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
