import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      dashboardTitle: "Agro-Connect Dashboard",
      smartFarming: "Smart Farming Platform",
      marketOverview: "Market Overview",
      totalMandis: "Total Regulated Mandis",
      activeMarkets: "Active Markets Nationwide",
      recentAdvisories: "Recent Advisories",
      priceHistoryWheat: "Price History (Wheat - Delhi)",
      latestPrices: "Latest Crop Prices",
      viewAll: "View All",
      fromLast: "from last recorded",
      changeLang: "हिंदी में बदलें",
      cropsTracked: "Crops Tracked",
      activePredictions: "Active predictions",
      wheatAvg: "Wheat (Avg)",
      marketsListed: "Markets Listed",
      acrossIndia: "Across India",
      activeAdvisories: "Active Advisories",
      updatedToday: "Updated today",
      urgency: {
        CRITICAL: "Critical",
        HIGH: "High",
        MEDIUM: "Medium",
        LOW: "Low"
      }
    }
  },
  hi: {
    translation: {
      dashboardTitle: "एग्रो-कनेक्ट डैशबोर्ड",
      smartFarming: "स्मार्ट खेती मंच",
      marketOverview: "बाजार अवलोकन",
      totalMandis: "कुल विनियमित मंडियां",
      activeMarkets: "देश भर में सक्रिय बाजार",
      recentAdvisories: "हाल की सलाह",
      priceHistoryWheat: "मूल्य इतिहास (गेहूं - दिल्ली)",
      latestPrices: "फसलों की नवीनतम कीमतें",
      viewAll: "सभी देखें",
      fromLast: "अंतिम रिकॉर्ड से",
      changeLang: "Switch to English",
      cropsTracked: "ट्रैक की गई फसलें",
      activePredictions: "सक्रिय भविष्यवाणियां",
      wheatAvg: "गेहूं (औसत)",
      marketsListed: "सूचीबद्ध बाजार",
      acrossIndia: "संपूर्ण भारत में",
      activeAdvisories: "सक्रिय सलाह",
      updatedToday: "आज अपडेट किया गया",
      urgency: {
        CRITICAL: "अति महत्वपूर्ण",
        HIGH: "महत्वपूर्ण",
        MEDIUM: "मध्यम",
        LOW: "कम"
      }
    }
  },
  mr: {
    translation: {
      dashboardTitle: "Agro-Connect डॅशबोर्ड",
      smartFarming: "स्मार्ट शेती प्लॅटफॉर्म",
      marketOverview: "बाजार आढावा",
      totalMandis: "एकूण बाजार समित्या (मंडी)",
      activeMarkets: "देशभरातील सक्रिय बाजार",
      recentAdvisories: "अलीकडील कृषी सल्ले",
      priceHistoryWheat: "किंमतीचा इतिहास (गहू - दिल्ली)",
      latestPrices: "पिकांचे नवीनतम दर",
      viewAll: "सर्व पहा",
      fromLast: "शेवटच्या नोंदीवरून",
      changeLang: "हिंदी / English",
      cropsTracked: "ट्रॅक केलेली पिके",
      activePredictions: "सक्रिय अंदाज",
      wheatAvg: "गहू (सरासरी)",
      marketsListed: "नोंदणीकृत बाजार",
      acrossIndia: "संपूर्ण भारतात",
      activeAdvisories: "सक्रिय सल्ले",
      updatedToday: "आज अद्यतनित",
      urgency: {
        CRITICAL: "अत्यंत तातडीचे",
        HIGH: "तातडीचे",
        MEDIUM: "मध्यम",
        LOW: "कमी"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
