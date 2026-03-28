package com.agroconnect.ui.screens

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.agroconnect.data.AgroRepository
import com.agroconnect.data.SupabaseClient
import com.agroconnect.models.DailyWeather
import com.agroconnect.models.WeatherResponse
import com.agroconnect.ui.theme.*
import io.github.jan.supabase.gotrue.auth
import kotlinx.coroutines.launch
import com.agroconnect.utils.LocationHelper
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import com.agroconnect.R
import kotlin.math.roundToInt

@Composable
fun WeatherScreen() {
    val scope = rememberCoroutineScope()
    var weather by remember { mutableStateOf<WeatherResponse?>(null) }
    var loading by remember { mutableStateOf(true) }

    val context = LocalContext.current
    LaunchedEffect(Unit) {
        scope.launch {
            try {
                // Try GPS first
                val loc = LocationHelper.getCurrentLocation(context)
                if (loc != null) {
                    weather = AgroRepository.getWeather(loc.latitude, loc.longitude)
                } else {
                    // Fallback to profile or Delhi
                    val user = com.agroconnect.data.SupabaseClient.client.auth.currentUserOrNull()
                    if (user != null) {
                        val profile = (AgroRepository.getFarmerProfile(user.id) as? com.agroconnect.models.LocationProfile) 
                            ?: (AgroRepository.getBuyerProfile(user.id) as? com.agroconnect.models.LocationProfile)
                        if (profile != null && profile.lat != null && profile.lon != null) {
                            weather = AgroRepository.getWeather(profile.lat!!, profile.lon!!)
                        } else {
                            weather = AgroRepository.getWeather(28.7136, 77.1747)
                        }
                    } else {
                        weather = AgroRepository.getWeather(28.7136, 77.1747)
                    }
                }
            } catch (e: Exception) { 
                Log.e("AgroConnect", "WeatherScreen failed: ${e.message}", e) 
            }
            loading = false
        }
    }

    if (loading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
        }
        return
    }

    val today = weather?.daily?.firstOrNull()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(vertical = 16.dp),
    ) {
        // Today's Weather Hero
        today?.let { day ->
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Green50),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Column(Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(weather?.city ?: stringResource(id = R.string.your_location), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                                Text(day.conditionDesc.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text(
                                "${day.tempAvg.roundToInt()}°C",
                                style = MaterialTheme.typography.displayLarge,
                                fontWeight = FontWeight.Bold,
                                color = Green800,
                            )
                        }

                        Spacer(Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                        ) {
                            WeatherStat(Icons.Filled.Thermostat, "H: ${day.tempMax.roundToInt()}° / L: ${day.tempMin.roundToInt()}°")
                            WeatherStat(Icons.Filled.WaterDrop, "${day.humidityAvg}%")
                            WeatherStat(Icons.Filled.Air, "${day.windAvgKph} km/h")
                            WeatherStat(Icons.Filled.Umbrella, "${day.totalPrecipitationMm}mm")
                        }
                    }
                }
            }
        }

        // 5-Day Forecast
        item {
            Text("📅 " + stringResource(id = R.string.five_day_forecast), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
        }

        weather?.daily?.let { days ->
            itemsIndexed(days) { index, day ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                if (index == 0) stringResource(id = R.string.today) else day.date,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                day.conditionDesc.replaceFirstChar { it.uppercase() },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                "${day.tempAvg.roundToInt()}°C",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                "${day.tempMax.roundToInt()}° / ${day.tempMin.roundToInt()}°",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }
        }

        // Farming Advisories
        weather?.farmingAdvisories?.takeIf { it.isNotEmpty() }?.let { advs ->
            item {
                Text("🌾 " + stringResource(id = R.string.farming_advice), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
            }

            items(advs) { adv ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.Top,
                    ) {
                        Icon(Icons.Filled.Spa, contentDescription = "Spa icon", tint = Lime600, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(10.dp))
                        Text(adv, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

@Composable
fun WeatherStat(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, contentDescription = "Graphic Element", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
        Spacer(Modifier.height(4.dp))
        Text(text, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Medium)
    }
}
