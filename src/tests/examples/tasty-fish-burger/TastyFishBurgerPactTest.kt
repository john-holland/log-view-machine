package com.logview.tastyfishburger

import au.com.dius.pact.consumer.PactVerificationResult
import au.com.dius.pact.consumer.dsl.PactDslWithProvider
import au.com.dius.pact.consumer.junit5.PactConsumerTestExt
import au.com.dius.pact.consumer.junit5.PactTestFor
import au.com.dius.pact.core.model.RequestResponsePact
import au.com.dius.pact.core.model.annotations.Pact
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.api.Assertions.assertEquals
import org.mockito.Mockito.mock
import java.time.Instant

@ExtendWith(PactConsumerTestExt::class)
@PactTestFor(providerName = "TastyFishBurgerProvider", port = "8080")
class TastyFishBurgerPactTest {
    private val mockMachine = mock(LogViewMachine::class.java)

    @Pact(consumer = "TastyFishBurgerConsumer")
    fun createPact(builder: PactDslWithProvider): RequestResponsePact {
        return builder
            .given("logs exist")
            .uponReceiving("a request for fish burger logs")
            .path("/graphql")
            .method("POST")
            .headers(mapOf(
                "Content-Type" to "application/json"
            ))
            .body("""
                {
                    "query": "query GetLogs($filter: LogFilter) { logs(filter: $filter) { id timestamp level message metadata } }",
                    "variables": {
                        "filter": {
                            "level": "INFO",
                            "search": "fish burger",
                            "startDate": "2024-03-20T00:00:00Z",
                            "endDate": "2024-03-20T23:59:59Z"
                        }
                    }
                }
            """.trimIndent())
            .willRespondWith()
            .status(200)
            .headers(mapOf(
                "Content-Type" to "application/json"
            ))
            .body("""
                {
                    "data": {
                        "logs": [
                            {
                                "id": "1",
                                "timestamp": "2024-03-20T12:00:00Z",
                                "level": "INFO",
                                "message": "Fish burger order received",
                                "metadata": {
                                    "orderId": "FB123",
                                    "ingredients": ["fish", "bun", "lettuce"],
                                    "status": "preparing"
                                }
                            }
                        ]
                    }
                }
            """.trimIndent())
            .toPact()
    }

    @Test
    @PactTestFor(pactMethod = "createPact")
    fun testFetchLogs() {
        val adapter = TastyFishBurgerAdapter(mockMachine)
        val filters = LogFilters(
            level = "INFO",
            search = "fish burger",
            startDate = Instant.parse("2024-03-20T00:00:00Z"),
            endDate = Instant.parse("2024-03-20T23:59:59Z")
        )
        val logs = adapter.fetchLogs(filters)
        
        assertEquals(1, logs.size)
        assertEquals("Fish burger order received", logs[0].message)
        assertEquals("INFO", logs[0].level)
        assertEquals("preparing", logs[0].metadata?.get("status"))
    }

    @Test
    @PactTestFor(pactMethod = "createPact")
    fun testAddLog() {
        val adapter = TastyFishBurgerAdapter(mockMachine)
        adapter.addLog(
            level = "INFO",
            message = "New fish burger order",
            metadata = mapOf(
                "orderId" to "FB124",
                "ingredients" to listOf("fish", "bun", "lettuce", "tomato"),
                "status" to "ordered"
            )
        )
    }
} 