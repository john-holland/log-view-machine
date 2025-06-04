# 🐟 Tasty Fish Burger API 🍔

Welcome to the most delicious API for creating custom fish burgers! This project combines the joy of burger creation with modern technology, including feature toggles, real-time metrics, and a beautiful GraphQL API.

## 🌟 Features

- 🎮 Interactive burger creation with state machine magic
- 🎯 Feature toggles for easy experimentation
- 📊 Real-time metrics and tracing
- 🎨 Beautiful GraphQL API
- 🐘 PostgreSQL for storing burger dreams
- 👥 Multi-cohort support for events and gatherings
- 🎨 Customizable skins with ICP payments
- 🎵 Sound effects and animations
- 🎨 Theme customization
- 📱 Responsive design

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🎨 Skin System

The Fish Burger API includes a powerful skinning system that allows users to customize their burger creation experience:

### Skin Types
- 🎨 **Themes**: Customize colors, fonts, and spacing
- 🎬 **Animations**: Add custom animations for burger creation and state transitions
- 🔊 **Sounds**: Include custom sound effects for various actions
- 🎯 **Custom**: Add your own CSS, JavaScript, and assets

### Features
- 💰 ICP payment integration
- ⭐ Rating system
- 📦 Collections for organizing skins
- 🎯 Preview system
- 🔄 Version compatibility checking

### Creating a Skin
1. Design your skin using the JSON schema
2. Upload assets (images, sounds, etc.)
3. Set your price in ICP
4. Submit for review
5. Once approved, your skin will be available in the store

### Example Skin
Check out `src/config/sample-skin.json` for a complete example of a skin configuration.

## 🎮 API Usage

### GraphQL Endpoint
```
http://localhost:3000/graphql
```

### Example Queries

#### Create a Skin
```graphql
mutation CreateSkin($input: CreateSkinInput!) {
  createSkin(input: $input) {
    id
    name
    description
    type
    priceIcp
    status
  }
}
```

#### Purchase a Skin
```graphql
mutation PurchaseSkin($id: ID!) {
  purchaseSkin(id: $id) {
    id
    transactionId
    amountIcp
  }
}
```

#### Rate a Skin
```graphql
mutation RateSkin($id: ID!, $rating: Int!, $comment: String) {
  rateSkin(id: $id, rating: $rating, comment: $comment) {
    id
    rating
  }
}
```

## 🛠️ Development

### Database Migrations
```bash
npm run migrate
```

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## 📊 Monitoring

- OpenTelemetry tracing via Jaeger
- Metrics via DataDog
- Custom dashboards for skin analytics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

MIT License - Because sharing is caring! 🎉

## 🙏 Acknowledgments

- All the fish that made this possible
- The burger enthusiasts who inspired this project
- The amazing open-source community 