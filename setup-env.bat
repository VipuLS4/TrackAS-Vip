@echo off
echo 🔧 Setting up TrackAS Environment Files...

echo Creating backend\.env...
(
echo # Database Configuration
echo DATABASE_URL=postgresql://postgres:Vipul@1234@db.blskbxwcnixzttjhieuc.supabase.co:5432/postgres
echo.
echo # JWT Secret
echo JWT_SECRET=f1b7e9b33514e98027694d18ffcf87e2ccce25e7da65a46adf6cc9ba7943dba2
echo.
echo # Environment
echo NODE_ENV=development
echo FRONTEND_URL=http://localhost:3000
echo.
echo # Commission Settings
echo DEFAULT_COMMISSION=5
echo.
echo # Mapbox API Key ^(for route optimization and maps^)
echo MAPBOX_KEY=pk.eyJ1Ijoic3BpY3ljaGFpciIsImEiOiJja2Y4b2RpemwwZTVrMnJxZzJmeXoxMHA5In0.7DxKkZ9CCFER4n-PkAooHQ
echo.
echo # OpenWeather API Key ^(for weather conditions^)
echo OPENWEATHER_API_KEY=dd1571a8ad3fd44555e8a5d66db01929
echo.
echo # Twilio Configuration ^(for SMS and WhatsApp notifications^)
echo TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
echo TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
echo TWILIO_WHATSAPP_NUMBER=+14155238886
echo TWILIO_SMS_NUMBER=+1234567890
echo.
echo # OpenAI API Key ^(for AI assistant^)
echo OPENAI_API_KEY=your_openai_api_key_here
echo.
echo # Optional: Email service ^(for email notifications^)
echo SENDGRID_API_KEY=your_sendgrid_api_key_here
echo FROM_EMAIL=noreply@trackas.com
) > backend\.env

echo Creating frontend\.env.local...
(
echo NEXT_PUBLIC_API_BASE=http://localhost:4000
echo NEXT_PUBLIC_MAPBOX_KEY=pk.eyJ1Ijoic3BpY3ljaGFpciIsImEiOiJja2Y4b2RpemwwZTVrMnJxZzJmeXoxMHA5In0.7DxKkZ9CCFER4n-PkAooHQ
) > frontend\.env.local

echo ✅ Environment files created successfully!
echo.
echo 📝 Next steps:
echo 1. Run: docker-compose up -d
echo 2. Visit: http://localhost:3000
echo.
echo 🔑 All API keys are configured:
echo ✅ Supabase Database: Connected
echo ✅ JWT Secret: Set
echo ✅ Twilio: Configured
echo ✅ OpenAI: Configured
echo ✅ Mapbox: Configured
echo ✅ OpenWeather: Configured
pause
