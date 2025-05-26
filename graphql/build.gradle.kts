dependencies {
    implementation(project(":core"))
    
    // GraphQL dependencies
    implementation("com.graphql-java:graphql-java:21.0")
    implementation("com.graphql-java:graphql-java-extended-scalars:21.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // Testing
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.9.2")
} 