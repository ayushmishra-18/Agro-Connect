package com.agroconnect.db

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface MandiDao {
    @Query("SELECT * FROM mandis")
    fun getAllMandis(): Flow<List<MandiEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(mandis: List<MandiEntity>)

    @Query("DELETE FROM mandis")
    suspend fun clearAll()
}

@Dao
interface PredictionDao {
    @Query("SELECT * FROM predictions WHERE cropId = :cropId AND mandiId = :mandiId LIMIT 1")
    fun getPrediction(cropId: Int, mandiId: Int): Flow<PredictionEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPrediction(prediction: PredictionEntity)
}

@Dao
interface AdvisoryDao {
    @Query("SELECT * FROM advisories")
    fun getAllAdvisories(): Flow<List<AdvisoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(advisories: List<AdvisoryEntity>)

    @Query("DELETE FROM advisories")
    suspend fun clearAll()
}

@Dao
interface WeatherDao {
    @Query("SELECT * FROM weather WHERE city = :city LIMIT 1")
    fun getWeather(city: String): Flow<WeatherEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWeather(weather: WeatherEntity)
}
