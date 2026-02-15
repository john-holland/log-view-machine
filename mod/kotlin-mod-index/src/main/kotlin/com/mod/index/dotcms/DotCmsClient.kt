package com.mod.index.dotcms

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor

class DotCmsClient(private val baseUrl: String, private val apiKey: String?) {
    private val retrofit: Retrofit
    private val service: DotCmsService
    
    init {
        val clientBuilder = OkHttpClient.Builder()
        if (apiKey != null) {
            clientBuilder.addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $apiKey")
                    .build()
                chain.proceed(request)
            }
        }
        
        val logging = HttpLoggingInterceptor()
        logging.level = HttpLoggingInterceptor.Level.BODY
        clientBuilder.addInterceptor(logging)
        
        retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(clientBuilder.build())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            
        service = retrofit.create(DotCmsService::class.java)
    }
    
    fun getService(): DotCmsService = service
}
