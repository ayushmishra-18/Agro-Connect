package com.agroconnect.db

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.agroconnect.models.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Entity(tableName = "mandis")
data class MandiEntity(
    @PrimaryKey val mandiId: Int,
    val mandiName: String,
    val stateCode: String,
    val districtName: String?,
    val latitude: Double,
    val longitude: Double,
    val createdAt: String?,
    val updatedAt: String?
) {
    fun toModel() = Mandi(
        mandiId = mandiId,
        mandiName = mandiName,
        stateCode = stateCode,
        districtName = districtName,
        latitude = latitude,
        longitude = longitude,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
    
    companion object {
        fun fromModel(m: Mandi) = MandiEntity(
            mandiId = m.mandiId,
            mandiName = m.mandiName,
            stateCode = m.stateCode,
            districtName = m.districtName,
            latitude = m.latitude,
            longitude = m.longitude,
            createdAt = m.createdAt,
            updatedAt = m.updatedAt
        )
    }
}

@Entity(tableName = "predictions", primaryKeys = ["cropId", "mandiId"])
data class PredictionEntity(
    val cropId: Int,
    val mandiId: Int,
    val predictionsJson: String,
    val confidenceScore: Double,
    val trendDirection: String,
    val sellWindowJson: String,
    val historicalSummaryJson: String
) {
    fun toModel(): PredictionResponse {
        val j = Json { ignoreUnknownKeys = true }
        return PredictionResponse(
            cropId = cropId,
            mandiId = mandiId,
            predictions = j.decodeFromString(predictionsJson),
            confidenceScore = confidenceScore,
            trendDirection = trendDirection,
            sellWindow = if (sellWindowJson.isNotBlank()) j.decodeFromString(sellWindowJson) else null,
            historicalSummary = if (historicalSummaryJson.isNotBlank()) j.decodeFromString(historicalSummaryJson) else null
        )
    }

    companion object {
        fun fromModel(p: PredictionResponse, cId: Int, mId: Int): PredictionEntity {
            val j = Json { ignoreUnknownKeys = true }
            return PredictionEntity(
                cropId = cId,
                mandiId = mId,
                predictionsJson = j.encodeToString(p.predictions),
                confidenceScore = p.confidenceScore,
                trendDirection = p.trendDirection,
                sellWindowJson = if (p.sellWindow != null) j.encodeToString(p.sellWindow) else "",
                historicalSummaryJson = if (p.historicalSummary != null) j.encodeToString(p.historicalSummary) else ""
            )
        }
    }
}

@Entity(tableName = "advisories")
data class AdvisoryEntity(
    @PrimaryKey val advisoryId: Int,
    val advisoryType: String,
    val cropId: Int?,
    val stateScope: String?,
    val titleEn: String,
    val contentEn: String,
    val urgency: String,
    val createdAt: String?,
    val createdBy: String?
) {
    fun toModel() = Advisory(
        advisoryId = advisoryId,
        advisoryType = advisoryType,
        cropId = cropId,
        stateScope = stateScope,
        titleEn = titleEn,
        contentEn = contentEn,
        urgency = urgency,
        createdAt = createdAt,
        createdBy = createdBy
    )
    
    companion object {
        fun fromModel(a: Advisory) = AdvisoryEntity(
            advisoryId = a.advisoryId,
            advisoryType = a.advisoryType,
            cropId = a.cropId,
            stateScope = a.stateScope,
            titleEn = a.titleEn,
            contentEn = a.contentEn,
            urgency = a.urgency,
            createdAt = a.createdAt,
            createdBy = a.createdBy
        )
    }
}

@Entity(tableName = "weather")
data class WeatherEntity(
    @PrimaryKey val city: String,
    val dailyJson: String,
    val advisoriesJson: String
) {
    fun toModel(): WeatherResponse {
        val j = Json { ignoreUnknownKeys = true }
        return WeatherResponse(
            city = city,
            daily = j.decodeFromString(dailyJson),
            farmingAdvisories = j.decodeFromString(advisoriesJson)
        )
    }
    
    companion object {
        fun fromModel(w: WeatherResponse): WeatherEntity {
            val j = Json { ignoreUnknownKeys = true }
            return WeatherEntity(
                city = w.city,
                dailyJson = j.encodeToString(w.daily),
                advisoriesJson = j.encodeToString(w.farmingAdvisories)
            )
        }
    }
}
