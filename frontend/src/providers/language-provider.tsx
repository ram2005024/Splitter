"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "ne";

export const translations = {
  en: {
    // Navigation
    navDashboard: "Dashboard",
    navGroups: "Groups",
    navBalances: "Balances & Settlements",
    navProfile: "Profile",
    navFeatures: "Features",
    navDebtSimp: "Debt Simplification",
    navSecurity: "Security",
    navLogin: "Log in",
    navSignup: "Sign up",
    navLogout: "Log out",
    navWorkspace: "Workspace",
    navManageProfile: "Manage Profile",
    loggingOut: "Logging out...",

    // Dashboard
    welcomeBack: "Welcome back",
    welcomeSubtitle: "Overview of your active expense groups, settlements, and balances",
    newGroup: "New Group",
    joinWithCode: "Join with Code",
    totalBalance: "Total Net Balance",
    totalYouAreOwed: "Total You are Owed",
    totalYouOwe: "Total You Owe",
    activeGroups: "Active Groups",
    activeGroupsDesc: "Groups where you are a member or administrator",
    settlementEngine: "Settlement Engine",
    settlementEngineDesc: "Automated debt reduction active for all groups",
    baseCurrency: "Base Currency",
    baseCurrencyDesc: "Configured in your user profile settings",
    yourExpenseGroups: "Your Expense Groups",
    yourExpenseGroupsDesc: "Select a group to record expenses, view balances, or settle debts",
    viewAllGroups: "View All Groups",
    noGroupsYet: "No Groups Yet",
    noGroupsYetDesc: "You haven't joined or created any groups. Create your first group or join one with an invite code.",
    createAGroup: "Create a Group",
    failedToLoadGroups: "Failed to load groups. Please try refreshing the page.",
    membersCount: "members",
    groupInviteCode: "Code",
    openGroup: "Open",
    quickActions: "Quick Actions",
    recentActivity: "Recent Activity",
    createGroupDesc: "Start a new expense circle for trips, flatmates, or projects",
    joinGroupDesc: "Enter a 6-character code to join an existing group",

    // Groups & Expense
    groupName: "Group Name",
    groupCategory: "Group Category",
    currency: "Currency",
    currencyFixedNote: "Fixed to Nepalese Rupee (NPR)",
    description: "Description",
    cancel: "Cancel",
    createGroupBtn: "Create Group",
    addExpense: "Add Expense",
    recordPayment: "Record Payment",
    goToGroup: "Go to Group",
    optimalSteps: "Optimal Settlement Steps",
    allSettled: "You are fully settled up in this group. No transactions needed!",
    noGroupsFound: "No Groups Found",
    noGroupsDesc: "You must be in at least one expense group to view balances and settlements.",

    // Balances
    youAreOwed: "You are Owed",
    youOwe: "You Owe",
    netPosition: "Net Position",
    inCredit: "In Credit",
    inDebt: "In Debt",
    settledUp: "Settled Up",
    totalSpending: "Total spending",
    youOweTo: "You owe",
    owesYou: "owes you",
    pay: "Pay",
    balancesSubtitle: "Detailed breakdown of your financial positions, debts, and simplified settlement transfers",

    // Categories
    catTrip: "Trip / Travel",
    catHome: "Home / Flatmates",
    catCouple: "Couple",
    catProject: "Project / Work",
    catOther: "Other",

    // Groups page
    expenseGroups: "Expense Groups",
    expenseGroupsDesc: "Collaborate on shared budgets, trips, roommates, and recurring household expenses",
    joinByCode: "Join by Code",
    createGroup: "Create Group",
    searchGroupPlaceholder: "Search by group name or invite code...",
    noMatchingGroups: "No Matching Groups Found",
    noGroupsJoined: "No Groups Joined Yet",
    noMatchingGroupsDesc: "Try adjusting your search terms or create a new group.",
    noGroupsJoinedDesc: "Create a group to start adding expenses, or join using an invite code.",
    createdOn: "Created",
    viewDetails: "View Details",
    copied: "Copied!",
    inviteCode: "Code",

    // Join Group Dialog
    joinGroupTitle: "Join Group with Invite Code",
    joinGroupDialogDesc: "Enter the invite code provided by your group organizer",
    inviteCodeLabel: "Invite Code",
    inviteCodePlaceholder: "e.g. ABC123XY",
    joinGroupBtn: "Join Group",
    joinFailedDefault: "Invalid invite code or already a member.",
    joinFailed: "Join Failed",
    creationFailed: "Creation Failed",
    createGroupFailedDefault: "Failed to create group. Please try again.",

    // Profile
    profileTitle: "User Profile & Settings",
    profileDesc: "Manage your personal details, preferred currency, and settlement handles",
    profileDetails: "Profile Details",
    profileDetailsDesc: "These details are visible to other members in your shared expense groups",
    verified: "Verified",
    activeAccount: "Active Account",
    accountCreated: "Account created on",
    defaultCurrency: "Default Currency",
    defaultCurrencyHelper: "Currently Splitter operates with NPR as the base currency",
    phoneNumber: "Phone Number",
    paymentHandle: "Payment Handle",
    paymentHandlePlaceholder: "e.g. alice@upi, @alice-venmo",
    paymentHandleHelper: "Share with group members to receive settlement payments easily",
    avatarUrl: "Avatar Image URL (Optional)",
    bio: "Bio",
    bioPlaceholder: "A brief intro about yourself...",
    saveChanges: "Save Changes",
    profileUpdated: "Profile updated successfully!",
    profileUpdateFailed: "Failed to update profile.",
    success: "Success",
    error: "Error",

    // General
    language: "Language",
    nepali: "नेपाली",
    english: "English",
    friend: "Friend",

    // Group Detail Page
    groupNotFound: "Group Not Found",
    groupNotFoundDesc: "The requested group does not exist or you do not have permission to view it.",
    backToGroups: "Back to Groups",
    inviteCodeCopied: "Invite Code Copied!",
    inviteCodeLabel2: "Invite Code",
    groupMembers2: "members",
    groupCurrencyLabel: "Currency",
    addMember: "Add Member",
    settleDebt: "Settle Debt",
    totalGroupSpending: "Total Group Spending",
    totalSettled: "Total Settled",
    recordedExpenses: "Recorded Expenses",
    simplificationStatus: "Simplification Status",
    transfersLeft: "transfers left",
    tabExpenses: "Expenses",
    tabBalances: "Member Balances",
    tabDebts: "Debt Simplification",
    tabMembers: "Members",
    recordedExpensesTitle: "Recorded Expenses",
    addNewExpense: "Add New Expense",
    noExpensesYet: "No Expenses Yet",
    noExpensesDesc: "Keep track of groceries, hotel bookings, or shared dinners by recording your first expense.",
    paidBy: "Paid by",
    splitType: "Split",
    netBalancesBreakdown: "Net Balances Breakdown",
    noBalanceData: "No balance data available.",
    netBalance: "Net Balance",
    totalPaid: "Total Paid",
    totalOwed: "Total Owed",
    settleMyShare: "Settle My Share",
    debtSimplificationTitle: "Greedy Debt Simplification (Min-Cash-Flow)",
    debtSimplificationDesc: "Optimized mathematical minimal transfers needed to fully settle all group debts",
    allDebtsSettled: "All Debts Settled!",
    allDebtsSettledDesc: "No outstanding transfers are needed. Everyone in this group is currently even.",
    owes: "owes",
    settleNow: "Settle Now",
    groupMembersTitle: "Group Members",
    joined: "Joined",
    createdAtLabel: "Created",

    // Add Expense Page
    addExpenseTitle: "Add Expense",
    addExpenseDesc: "Record a shared expense in",
    expenseTitleLabel: "Expense Description / Title",
    expenseTitlePlaceholder: "e.g. Dinner, Hotel, Groceries",
    totalAmountLabel: "Total Amount",
    categoryLabel: "Category",
    paidByLabel: "Paid By",
    notesLabel: "Notes (Optional)",
    notesPlaceholder: "Additional notes about this expense",
    splitConfigTitle: "Split Configuration",
    splitConfigDesc: "Choose how this expense is divided",
    ofMembers: "of",
    noMembersForSplit: "No members found in this group. Add members before splitting expenses.",
    saveAndSplit: "Save & Split Expense",
    submissionError: "Submission Error",
    expenseFailedDefault: "Failed to record expense. Please check your split inputs.",
    groupNotFoundShort: "Group not found.",
    shares: "shares",

    // Expense Categories
    catFood: "Food & Drink",
    catGroceries: "Groceries",
    catTransportation: "Transportation",
    catEntertainment: "Entertainment",
    catRent: "Rent / Housing",
    catUtilities: "Utilities",
    catTravel: "Travel / Flight",
    catShopping: "Shopping",
    catHealth: "Health & Medical",
    catGeneral: "General",
  },
  ne: {
    // Navigation
    navDashboard: "ड्यासबोर्ड",
    navGroups: "समूहहरू",
    navBalances: "ब्यालेन्स तथा हिसाब",
    navProfile: "प्रोफाइल",
    navFeatures: "विशेषताहरू",
    navDebtSimp: "ऋण सरलीकरण",
    navSecurity: "सुरक्षा",
    navLogin: "लग इन",
    navSignup: "दर्ता हुनुहोस्",
    navLogout: "लग आउट",
    navWorkspace: "कार्यक्षेत्र",
    navManageProfile: "प्रोफाइल सम्पादन",
    loggingOut: "लग आउट हुँदैछ...",

    // Dashboard
    welcomeBack: "पुनः स्वागत छ",
    welcomeSubtitle: "तपाईंको सक्रिय खर्च समूह, हिसाब चुक्ता र ब्यालेन्सको विवरण",
    newGroup: "नयाँ समूह",
    joinWithCode: "कोडबाट जोडिनुहोस्",
    totalBalance: "कुल खुद ब्यालेन्स",
    totalYouAreOwed: "तपाईंले पाउनुपर्ने",
    totalYouOwe: "तपाईंले तिर्नुपर्ने",
    activeGroups: "सक्रिय समूहहरू",
    activeGroupsDesc: "जुन समूहमा तपाईं सदस्य वा प्रशासक हुनुहुन्छ",
    settlementEngine: "हिसाब इञ्जिन",
    settlementEngineDesc: "सबै समूहमा स्वचालित ऋण घटाउने प्रणाली सक्रिय",
    baseCurrency: "आधार मुद्रा",
    baseCurrencyDesc: "तपाईंको प्रोफाइल सेटिङमा कन्फिगर गरिएको",
    yourExpenseGroups: "तपाईंका खर्च समूहहरू",
    yourExpenseGroupsDesc: "खर्च थप्न, ब्यालेन्स हेर्न वा हिसाब चुक्ता गर्न समूह रोज्नुहोस्",
    viewAllGroups: "सबै समूह हेर्नुहोस्",
    noGroupsYet: "अहिलेसम्म कुनै समूह छैन",
    noGroupsYetDesc: "तपाईं अझै कुनै समूहमा जोडिनुभएको छैन। पहिलो समूह बनाउनुहोस् वा कोडबाट जोडिनुहोस्।",
    createAGroup: "समूह बनाउनुहोस्",
    failedToLoadGroups: "समूह लोड गर्न असफल। कृपया पृष्ठ ताजा गर्नुहोस्।",
    membersCount: "सदस्य",
    groupInviteCode: "कोड",
    openGroup: "खोल्नुहोस्",
    quickActions: "द्रुत कार्यहरू",
    recentActivity: "हालको गतिविधि",
    createGroupDesc: "यात्रा, कोठाका साथी वा परियोजनाका लागि नयाँ समूह बनाउनुहोस्",
    joinGroupDesc: "अवस्थित समूहमा सामेल हुन ६-अक्षरको कोड प्रविष्ट गर्नुहोस्",

    // Groups & Expense
    groupName: "समूहको नाम",
    groupCategory: "समूहको वर्ग",
    currency: "मुद्रा",
    currencyFixedNote: "नेपाली रूपैयाँ (NPR) मा निर्धारित",
    description: "विवरण",
    cancel: "रद्द गर्नुहोस्",
    createGroupBtn: "समूह बनाउनुहोस्",
    addExpense: "खर्च थप्नुहोस्",
    recordPayment: "भुक्तानी रेकर्ड",
    goToGroup: "समूह हेर्नुहोस्",
    optimalSteps: "उत्कृष्ट हिसाब समाधान",
    allSettled: "यस समूहमा तपाईंको सम्पूर्ण हिसाब चुक्ता भएको छ!",
    noGroupsFound: "कुनै समूह भेटिएन",
    noGroupsDesc: "ब्यालेन्स र हिसाब हेर्नको लागि तपाईं कम्तीमा एक समूहमा हुनुपर्छ।",

    // Balances
    youAreOwed: "पाउनुपर्ने रकम",
    youOwe: "तिर्नुपर्ने रकम",
    netPosition: "खुद स्थिति",
    inCredit: "जम्मा",
    inDebt: "ऋण",
    settledUp: "चुक्ता",
    totalSpending: "कुल खर्च",
    youOweTo: "तपाईंले तिर्नुपर्ने",
    owesYou: "ले तिर्नुपर्ने",
    pay: "तिर्नुहोस्",
    balancesSubtitle: "तपाईंको वित्तीय स्थिति, ऋण तथा सरलीकृत हिसाब चुक्ताको विस्तृत विवरण",

    // Categories
    catTrip: "यात्रा / भ्रमण",
    catHome: "घर / कोठाका साथी",
    catCouple: "दम्पती",
    catProject: "परियोजना / काम",
    catOther: "अन्य",

    // Groups page
    expenseGroups: "खर्च समूहहरू",
    expenseGroupsDesc: "साझा बजेट, यात्रा, कोठाका साथी र नियमित घरखर्चमा सहकार्य गर्नुहोस्",
    joinByCode: "कोडबाट जोडिनुहोस्",
    createGroup: "समूह बनाउनुहोस्",
    searchGroupPlaceholder: "समूहको नाम वा कोडबाट खोज्नुहोस्...",
    noMatchingGroups: "कुनै मिल्दो समूह भेटिएन",
    noGroupsJoined: "अझैसम्म कुनै समूहमा जोडिनुभएको छैन",
    noMatchingGroupsDesc: "खोज शब्द परिवर्तन गर्नुहोस् वा नयाँ समूह बनाउनुहोस्।",
    noGroupsJoinedDesc: "खर्च थप्न समूह बनाउनुहोस् वा कोडबाट जोडिनुहोस्।",
    createdOn: "बनाइएको",
    viewDetails: "विवरण हेर्नुहोस्",
    copied: "कपी भयो!",
    inviteCode: "कोड",

    // Join Group Dialog
    joinGroupTitle: "कोडबाट समूहमा सामेल हुनुहोस्",
    joinGroupDialogDesc: "समूह आयोजकले दिएको कोड प्रविष्ट गर्नुहोस्",
    inviteCodeLabel: "आमन्त्रण कोड",
    inviteCodePlaceholder: "जस्तै: ABC123XY",
    joinGroupBtn: "समूहमा सामेल हुनुहोस्",
    joinFailedDefault: "अमान्य कोड वा पहिले नै सदस्य हुनुहुन्छ।",
    joinFailed: "सामेल हुन असफल",
    creationFailed: "सिर्जना असफल",
    createGroupFailedDefault: "समूह सिर्जना गर्न असफल। कृपया पुनः प्रयास गर्नुहोस्।",

    // Profile
    profileTitle: "प्रयोगकर्ता प्रोफाइल तथा सेटिङ",
    profileDesc: "आफ्नो व्यक्तिगत विवरण, मुद्रा र भुक्तानी ह्यान्डल व्यवस्थापन गर्नुहोस्",
    profileDetails: "प्रोफाइल विवरण",
    profileDetailsDesc: "यी विवरण तपाईंका साझा खर्च समूहका अन्य सदस्यहरूलाई देखिन्छ",
    verified: "प्रमाणित",
    activeAccount: "सक्रिय खाता",
    accountCreated: "खाता बनाइएको मिति",
    defaultCurrency: "आधार मुद्रा",
    defaultCurrencyHelper: "Splitter अहिले NPR लाई आधार मुद्राको रूपमा प्रयोग गर्दछ",
    phoneNumber: "फोन नम्बर",
    paymentHandle: "भुक्तानी ह्यान्डल",
    paymentHandlePlaceholder: "जस्तै: alice@upi, @alice-venmo",
    paymentHandleHelper: "समूह सदस्यहरूसँग साझा गर्नुहोस् ताकि भुक्तानी सजिलो होस्",
    avatarUrl: "अवतार छवि URL (वैकल्पिक)",
    bio: "परिचय",
    bioPlaceholder: "आफ्नोबारे छोटो परिचय...",
    saveChanges: "परिवर्तन सुरक्षित गर्नुहोस्",
    profileUpdated: "प्रोफाइल सफलतापूर्वक अपडेट भयो!",
    profileUpdateFailed: "प्रोफाइल अपडेट गर्न असफल।",
    success: "सफल",
    error: "त्रुटि",

    // General
    language: "भाषा",
    nepali: "नेपाली",
    english: "English",
    friend: "साथी",

    // Group Detail Page
    groupNotFound: "समूह फेला परियो",
    groupNotFoundDesc: "अनुरोध गरिएको समूह फेला परियो वा तपाईंलाई हेर्ने अनुमति छैन।",
    backToGroups: "समूहमा फर्कनुहोस्",
    inviteCodeCopied: "आमन्त्रण कोड कपी भयो!",
    inviteCodeLabel2: "आमन्त्रण कोड",
    groupMembers2: "सदस्यहरू",
    groupCurrencyLabel: "मुद्रा",
    addMember: "सदस्य थप्नुहोस्",
    settleDebt: "हिसाब चुक्ता",
    totalGroupSpending: "कुल समूह खर्च",
    totalSettled: "कुल चुक्ता",
    recordedExpenses: "रेकर्ड खर्च",
    simplificationStatus: "सरलीकरण अवस्था",
    transfersLeft: "हस्तान्तरण बाँकी",
    tabExpenses: "खर्चहरू",
    tabBalances: "सदस्य ब्यालेन्स",
    tabDebts: "हिसाब सरलीकरण",
    tabMembers: "सदस्यहरू",
    recordedExpensesTitle: "रेकर्ड खर्चहरू",
    addNewExpense: "नयाँ खर्च थप्नुहोस्",
    noExpensesYet: "अहिलेसम्म खर्च छैन",
    noExpensesDesc: "खाना, होटेल वा साझा खर्च ट्र्याक गर्न पहिलो खर्च रेकर्ड गर्नुहोस्।",
    paidBy: "तिरेकोले",
    splitType: "बाँडफाँट",
    netBalancesBreakdown: "खुद ब्यालेन्सको विवरण",
    noBalanceData: "कुनै ब्यालेन्स डेटा उपलब्ध छैन।",
    netBalance: "खुद ब्यालेन्स",
    totalPaid: "कुल तिरेको",
    totalOwed: "कुल चाहिएको",
    settleMyShare: "मेरो हिस्सा चुक्ता गर्नुहोस्",
    debtSimplificationTitle: "डेट सरलीकरण (Min-Cash-Flow)",
    debtSimplificationDesc: "समूहका सम्पूर्ण हिसाब चुक्ता गर्न हिसाबी रूपमा न्यूनतम हस्तान्तरण सुझाव",
    allDebtsSettled: "सम्पूर्ण हिसाब चुक्ता!",
    allDebtsSettledDesc: "कुनै बाँकी हस्तान्तरण छैन। समूहका सवै सदस्यहरू हाल बराबरामा छन्।",
    owes: "तिर्नुपर्ने",
    settleNow: "अहिले चुक्ता गर्नुहोस्",
    groupMembersTitle: "समूहका सदस्यहरू",
    joined: "जोडिएको",
    createdAtLabel: "बनाइएको",

    // Add Expense Page
    addExpenseTitle: "खर्च थप्नुहोस्",
    addExpenseDesc: "साझा खर्च रेकर्ड गर्नुहोस्",
    expenseTitleLabel: "खर्चको विवरण / शीर्षक",
    expenseTitlePlaceholder: "जस्तै: खाना, होटेल, किराना",
    totalAmountLabel: "कुल रकम",
    categoryLabel: "वर्ग",
    paidByLabel: "तिरेकोले",
    notesLabel: "टिप्पणी (वैकल्पिक)",
    notesPlaceholder: "यस खर्चबारे थप जानकारी",
    splitConfigTitle: "बाँडफाँट कन्फिगरेसन",
    splitConfigDesc: "यो खर्च कसरी बाँड्ने चुन्नुहोस्",
    ofMembers: "मध्ये",
    noMembersForSplit: "समूहमा कुनै सदस्य फेला परिएन। खर्च बाँड्नुअगाडि सदस्य थप्नुहोस्।",
    saveAndSplit: "सुरक्षित गर्नुहोस् र बाँड्नुहोस्",
    submissionError: "पेश गर्न त्रुटि",
    expenseFailedDefault: "खर्च रेकर्ड गर्न असफल। कृपया बाँडफाँट इनपुट जाँच गर्नुहोस्।",
    groupNotFoundShort: "समूह फेला परियो।",
    shares: "हिस्सा",

    // Expense Categories
    catFood: "खानापानी",
    catGroceries: "किराना",
    catTransportation: "सवारी",
    catEntertainment: "मनोरञ्जन",
    catRent: "भाडा / घर",
    catUtilities: "सुविधाहरू",
    catTravel: "यात्रा / उडान",
    catShopping: "खरिदारी",
    catHealth: "स्वास्थ्य",
    catGeneral: "सामान्य",
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => translations.en[key] || key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("splitter-lang") as Language | null;
    if (saved === "en" || saved === "ne") {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("splitter-lang", lang);
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "ne" : "en";
    setLanguage(next);
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
