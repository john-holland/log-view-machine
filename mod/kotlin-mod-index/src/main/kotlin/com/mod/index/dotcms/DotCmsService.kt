package com.mod.index.dotcms

import retrofit2.http.*
import retrofit2.Call

interface DotCmsService {
    @GET("/api/content/render/false")
    fun getContent(
        @Query("query") query: String,
        @Header("Authorization") auth: String
    ): Call<DotCmsContentResponse>
    
    @GET("/api/v1/users/current")
    fun getCurrentUser(
        @Header("Authorization") auth: String
    ): Call<DotCmsUser>
    
    @GET("/api/v1/sites")
    fun getSites(
        @Header("Authorization") auth: String
    ): Call<List<DotCmsSite>>

    /** Mod IDs assigned to the current user (e.g. admin gets ["fish-burger-mod"]). */
    @GET("/api/v1/users/current/mods")
    fun getModsForCurrentUser(
        @Header("Authorization") auth: String
    ): Call<ModIdsResponse>

    /** CORS whitelist: allowed origins for mod external APIs. */
    @GET("/api/v1/cors-whitelist")
    fun getCorsWhitelist(): Call<CorsWhitelistResponse>
}

data class DotCmsContentResponse(
    val contentlets: List<Map<String, Any>>? = null,
    val totalResults: Int? = null
)

data class DotCmsUser(
    val userId: String? = null,
    val email: String? = null,
    val firstName: String? = null,
    val lastName: String? = null
)

data class DotCmsSite(
    val identifier: String? = null,
    val hostname: String? = null,
    val aliases: List<String>? = null
)

data class ModIdsResponse(
    val modIds: List<String>? = null
)

data class CorsWhitelistResponse(
    val allowedOrigins: List<String>? = null
)
