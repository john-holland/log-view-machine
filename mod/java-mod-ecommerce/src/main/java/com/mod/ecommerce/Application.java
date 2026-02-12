package com.mod.ecommerce;

import io.javalin.Javalin;
import io.javalin.http.Context;
import com.mod.ecommerce.webhook.TipTopJarWebhookHandler;
import com.mod.ecommerce.api.RedeemHandler;
import com.mod.ecommerce.database.DatabaseManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Application {
    private static final Logger logger = LoggerFactory.getLogger(Application.class);
    
    public static void main(String[] args) {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8083"));
        
        // Initialize database
        DatabaseManager dbManager = new DatabaseManager();
        dbManager.initialize();
        
        // Create handlers
        TipTopJarWebhookHandler webhookHandler = new TipTopJarWebhookHandler(dbManager);
        RedeemHandler redeemHandler = new RedeemHandler(dbManager);
        
        // Create Javalin app
        Javalin app = Javalin.create(config -> {
            config.plugins.enableCors(cors -> {
                cors.add(it -> {
                    it.anyHost();
                });
            });
        });
        
        // Health check
        app.get("/health", ctx -> ctx.result("OK"));
        
        // Webhook endpoint
        app.post("/webhook/tiptopjar", webhookHandler::handle);
        
        // Redeem endpoint
        app.post("/api/donations/redeem", redeemHandler::handle);
        
        app.start(port);
        logger.info("java-mod-ecommerce started on port {}", port);
    }
}
