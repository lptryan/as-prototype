/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import FarmMap from './pages/FarmMap';
import Campaigns from './pages/Campaigns';
import DesignStudio from './pages/DesignStudio';
import Orders from './pages/Orders';
import Credits from './pages/Credits';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminOrders from './pages/AdminOrders';
import AdminBranding from './pages/AdminBranding';
import AdminSettings from './pages/AdminSettings';
import AdminEmailStudio from './pages/AdminEmailStudio';
import AdminAnalytics from './pages/AdminAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "FarmMap": FarmMap,
    "Campaigns": Campaigns,
    "DesignStudio": DesignStudio,
    "Orders": Orders,
    "Credits": Credits,
    "AdminDashboard": AdminDashboard,
    "AdminUsers": AdminUsers,
    "AdminOrders": AdminOrders,
    "AdminBranding": AdminBranding,
    "AdminSettings": AdminSettings,
    "AdminEmailStudio": AdminEmailStudio,
    "AdminAnalytics": AdminAnalytics,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};