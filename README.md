# Disease Data Analysis Dashboard

A comprehensive Next.js dashboard for analyzing disease survey data with AI-powered insights and interactive visualizations.

## Features

- **Interactive Data Visualization**: Generate bar, line, and pie charts based on disease and demographic data
- **AI-Powered Chat Interface**: Ask questions about the data using OpenAI integration
- **Real-time Database Integration**: Connect to MySQL database with disease survey responses
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **Multi-variable Analysis**: Analyze relationships between diseases and variables like age, gender, and season
- **Downloadable Charts**: Export charts as PNG images
- **Summary Statistics**: Overview of total diseases, responders, and active surveys

## Database Schema

The dashboard works with the following database structure:

### Tables
- **diseases**: Disease information (malaria, cholera, heat stress)
- **questions**: Survey questions for each disease
- **choices**: Answer choices for questions
- **responders**: Survey participants
- **responses**: Individual survey responses linking responders to questions and choices

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- MySQL database with the provided schema
- OpenAI API access (or compatible endpoint)

### 2. Installation

```bash
# Clone or create the project directory
mkdir disease-dashboard
cd disease-dashboard

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://your-openai-endpoint.com/v1/
OPENAI_MODEL=gpt-4o

# Database Configuration (used in lib/database.js)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lavarel
```

### 4. Database Setup

Import your existing database or create the tables using the provided schema:

```sql
-- Your existing database schema with diseases, questions, choices, responders, and responses tables
```

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Data Visualization Queries

Structure your queries to include:
1. **Diseases**: malaria, cholera, heat stress
2. **Variables**: age, gender, season
3. **Chart Types**: bar, line, pie

**Example Query:**
```
Show me the correlation between Malaria, Cholera and age and gender using a bar and line chart
```

This will generate:
```json
{
  "Diseases": ["malaria", "cholera"],
  "Variables": ["age", "gender"],
  "Chart types": ["bar", "line"]
}
```

### Variable Mappings

- **Age**: "Are you older than 35 years old?" → Above 35 / Below 35
- **Gender**: "Are you a Male or Female?" → Male / Female  
- **Season**: "Are you treated more during rainy season?" → Rainy Season / Dry Season

### General Questions

Ask general questions about diseases, health, or data analysis:
```
What is malaria?
How does climate change affect disease patterns?
```

## File Structure

```
disease-dashboard/
├── pages/
│   ├── index.js              # Main dashboard component
│   └── api/
│       ├── chat.js           # OpenAI integration
│       └── data.js           # Database API endpoints
├── lib/
│   └── database.js           # Database connection utilities
├── styles/
│   └── globals.css           # Global styles and Tailwind CSS
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind configuration
└── .env.example              # Environment variables template
```

## API Endpoints

### `/api/chat`
- **Method**: POST
- **Purpose**: Process general questions using OpenAI
- **Body**: `{ message: "your question" }`

### `/api/data`
- **Method**: GET
- **Purpose**: Fetch database analytics
- **Parameters**: 
  - `type`: analytics, diseases, questions, summary
  - `diseases`: comma-separated disease names
  - `variables`: comma-separated variable names

## Chart Features

- **Interactive**: Hover tooltips and legends
- **Responsive**: Adapts to screen size
- **Downloadable**: Export as PNG images
- **Multi-layered**: Group by diseases and variables
- **Descriptive**: Automatic descriptions below charts

## Troubleshooting

### Database Connection Issues
- Verify MySQL credentials in environment variables
- Check if the database server is running
- Ensure the database schema matches the expected structure

### OpenAI API Issues
- Verify API key and endpoint URL
- Check API rate limits and quotas
- Ensure the model name is correct

### Chart Rendering Issues
- Check browser console for Chart.js errors
- Verify data structure matches expected format
- Ensure all required dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.# Afretec-next-js-analysis-dashboard
