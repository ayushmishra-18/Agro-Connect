package com.agroconnect

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.agroconnect.ui.navigation.Screen
import com.agroconnect.ui.screens.*
import com.agroconnect.ui.theme.AgroConnectTheme
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.handleDeeplinks

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Handle deep link redirect from Supabase Auth
        com.agroconnect.data.SupabaseClient.client.handleDeeplinks(intent)
        
        // Initialize Room DB
        com.agroconnect.data.AgroRepository.init(applicationContext)

        // Enqueue background sync every 12 hours
        val syncWorkRequest = androidx.work.PeriodicWorkRequestBuilder<com.agroconnect.utils.SyncWorker>(
            12, java.util.concurrent.TimeUnit.HOURS
        ).setConstraints(
            androidx.work.Constraints.Builder()
                .setRequiredNetworkType(androidx.work.NetworkType.CONNECTED)
                .build()
        ).build()
        androidx.work.WorkManager.getInstance(applicationContext).enqueueUniquePeriodicWork(
            "AgroConnectDataSync",
            androidx.work.ExistingPeriodicWorkPolicy.KEEP,
            syncWorkRequest
        )
        
        enableEdgeToEdge()
        setContent {
            AgroConnectTheme {
                AgroConnectApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgroConnectApp() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    var startDestination by remember { mutableStateOf<String?>(null) }
    
    LaunchedEffect(Unit) {
        val session = com.agroconnect.data.SupabaseClient.client.auth.currentAccessTokenOrNull()
        startDestination = if (session != null) Screen.Dashboard.route else Screen.Login.route
    }

    if (startDestination == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    val currentRoute = navBackStackEntry?.destination?.route ?: startDestination!!
    val isAuthScreen = currentRoute == Screen.Login.route || currentRoute == Screen.Register.route

    Scaffold(
        topBar = {
            if (!isAuthScreen) {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            when (currentRoute) {
                                Screen.Dashboard.route -> "Agro-Connect"
                                Screen.Predictions.route -> "Price Forecasts"
                                Screen.Marketplace.route -> "Marketplace"
                                Screen.Weather.route -> "Weather"
                                Screen.Advisories.route -> "Farming Tips"
                                Screen.CreateListing.route -> "Sell Your Produce"
                                else -> "Agro-Connect"
                            },
                            fontWeight = FontWeight.Bold,
                        )
                    },
                    actions = {
                        if (currentRoute != Screen.Settings.route) {
                            IconButton(onClick = { navController.navigate(Screen.Settings.route) }) {
                                Icon(Icons.Filled.Settings, contentDescription = "Settings")
                            }
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        titleContentColor = MaterialTheme.colorScheme.onPrimary,
                        actionIconContentColor = MaterialTheme.colorScheme.onPrimary,
                    ),
                )
            }
        },
        bottomBar = {
            if (!isAuthScreen && currentRoute != Screen.Settings.route) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 4.dp,
                ) {
                    val navItems = listOf(
                        Screen.Dashboard, 
                        Screen.Predictions, 
                        Screen.Marketplace, 
                        Screen.Weather, 
                        Screen.Advisories
                    )
                    navItems.forEach { screen ->
                        NavigationBarItem(
                            icon = {
                                Icon(
                                    imageVector = if (currentRoute == screen.route) screen.selectedIcon else screen.unselectedIcon,
                                    contentDescription = screen.title,
                                )
                            },
                            label = { Text(screen.title, style = MaterialTheme.typography.labelSmall) },
                            selected = currentRoute == screen.route,
                            onClick = {
                                if (currentRoute != screen.route) {
                                    navController.navigate(screen.route) {
                                        popUpTo(Screen.Dashboard.route) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                            ),
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = startDestination!!,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Screen.Login.route) { LoginScreen(navController) }
            composable(Screen.Register.route) { RegisterScreen(navController) }
            composable(Screen.Dashboard.route) { DashboardScreen(navController) }
            composable(Screen.Predictions.route) { PredictionsScreen() }
            composable(Screen.Marketplace.route) { MarketplaceScreen(navController) }
            composable(Screen.CreateListing.route) { CreateListingScreen(navController) }
            composable(
                route = Screen.ListingDetail.route,
                arguments = listOf(androidx.navigation.navArgument("listingId") { type = androidx.navigation.NavType.LongType })
            ) { backStackEntry ->
                val listingId = backStackEntry.arguments?.getLong("listingId") ?: 0L
                ListingDetailScreen(navController, listingId)
            }
            composable(Screen.Cart.route) { CartScreen(navController) }
            composable(Screen.Checkout.route) { CheckoutScreen(navController) }
            composable(Screen.Orders.route) { OrdersScreen(navController) }
            composable(Screen.Weather.route) { WeatherScreen() }
            composable(Screen.Advisories.route) { AdvisoriesScreen() }
            composable(Screen.Settings.route) { SettingsScreen(navController) }
        }
    }
}
