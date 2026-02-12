package com.mod.ecommerce.database;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class DatabaseManager {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseManager.class);
    private Connection connection;
    
    public void initialize() {
        String dbUrl = System.getenv().getOrDefault("DB_URL", "jdbc:h2:file:./data/donations");
        try {
            connection = DriverManager.getConnection(dbUrl, "sa", "");
            createTables();
            logger.info("Database initialized: {}", dbUrl);
        } catch (SQLException e) {
            logger.error("Failed to initialize database", e);
            throw new RuntimeException("Database initialization failed", e);
        }
    }
    
    private void createTables() throws SQLException {
        String createTable = """
            CREATE TABLE IF NOT EXISTS donations (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                tipper_name VARCHAR(255) NOT NULL,
                recipient_account VARCHAR(255) NOT NULL,
                amount DECIMAL(18, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                timestamp_ms BIGINT NOT NULL,
                webhook_tracking_params TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                redeemed_at TIMESTAMP NULL,
                redeemed_by_name VARCHAR(255) NULL,
                associated_tome_or_session VARCHAR(255) NULL,
                tenant_id VARCHAR(255) NULL,
                INDEX idx_recipient_tipper (recipient_account, tipper_name),
                INDEX idx_redeemed (redeemed_at)
            )
        """;
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(createTable);
            logger.info("Donations table created or already exists");
        }
    }
    
    public void insertDonation(Donation donation) throws SQLException {
        String sql = """
            INSERT INTO donations (
                tipper_name, recipient_account, amount, currency, timestamp_ms,
                webhook_tracking_params, tenant_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """;
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, donation.getTipperName());
            stmt.setString(2, donation.getRecipientAccount());
            stmt.setBigDecimal(3, donation.getAmount());
            stmt.setString(4, donation.getCurrency());
            stmt.setLong(5, donation.getTimestampMs());
            stmt.setString(6, donation.getWebhookTrackingParams());
            stmt.setString(7, donation.getTenantId());
            stmt.executeUpdate();
            logger.info("Donation inserted: {} from {}", donation.getAmount(), donation.getTipperName());
        }
    }
    
    public Optional<Donation> findUnredeemedDonation(String tipperName) throws SQLException {
        String sql = """
            SELECT * FROM donations
            WHERE tipper_name = ? AND redeemed_at IS NULL
            ORDER BY timestamp_ms ASC
            LIMIT 1
        """;
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, tipperName);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return Optional.of(mapToDonation(rs));
            }
        }
        return Optional.empty();
    }
    
    public void markAsRedeemed(long donationId, String redeemedByName) throws SQLException {
        String sql = """
            UPDATE donations
            SET redeemed_at = CURRENT_TIMESTAMP, redeemed_by_name = ?
            WHERE id = ?
        """;
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, redeemedByName);
            stmt.setLong(2, donationId);
            int updated = stmt.executeUpdate();
            if (updated > 0) {
                logger.info("Donation {} marked as redeemed by {}", donationId, redeemedByName);
            }
        }
    }
    
    private Donation mapToDonation(ResultSet rs) throws SQLException {
        Donation d = new Donation();
        d.setId(rs.getLong("id"));
        d.setTipperName(rs.getString("tipper_name"));
        d.setRecipientAccount(rs.getString("recipient_account"));
        d.setAmount(rs.getBigDecimal("amount"));
        d.setCurrency(rs.getString("currency"));
        d.setTimestampMs(rs.getLong("timestamp_ms"));
        d.setWebhookTrackingParams(rs.getString("webhook_tracking_params"));
        d.setCreatedAt(rs.getTimestamp("created_at"));
        d.setRedeemedAt(rs.getTimestamp("redeemed_at"));
        d.setRedeemedByName(rs.getString("redeemed_by_name"));
        d.setTenantId(rs.getString("tenant_id"));
        return d;
    }
    
    public Connection getConnection() {
        return connection;
    }
}
