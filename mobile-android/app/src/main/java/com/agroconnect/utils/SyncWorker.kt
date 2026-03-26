package com.agroconnect.utils

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.agroconnect.data.AgroRepository
import com.agroconnect.data.SupabaseClient

class SyncWorker(appContext: Context, workerParams: WorkerParameters) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        Log.d("SyncWorker", "Starting background data synchronization...")
        
        try {
            // Ensure repository is initialized
            AgroRepository.init(applicationContext)

            // 1. Sync Mandis
            AgroRepository.getMandis()

            // 2. Sync Advisories
            AgroRepository.getAdvisories()

            // 3. Sync Predictions (if user is logged in and is a farmer with a preferred crop)
            // Note: Since auth session might not be active in background if strictly scoped, 
            // but GoTrue auto-refreshes if possible. We just try to get the farmer profile.
            // For a robust sync, we'd save preferred crop/mandi IDs in SharedPreferences.
            // For now, we just rely on general caching for Mandis & Advisories.
            
            Log.d("SyncWorker", "Background synchronization completed successfully.")
            return Result.success()
        } catch (e: Exception) {
            Log.e("SyncWorker", "Background synchronization failed", e)
            return Result.retry()
        }
    }
}
