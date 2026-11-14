export type Language = 'en' | 'hi';

export const DICTIONARY = {
  en: {
    // Navigation
    overview: 'Overview',
    myWallet: 'My Wallet',
    sendMoney: 'Send Money',
    receiveMoney: 'Receive Money',
    transactions: 'Transactions',
    securityCentre: 'Security Centre',
    financialInsights: 'Financial Insights',
    logout: 'Logout',
    returnHome: 'Return to Home',

    // Dashboard Header
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    securityOverviewSubtitle: 'Your financial security overview.',
    walletProtected: 'SHIELD ACTIVE',
    walletProtectedDetail: 'Autonomous AI protection online',
    ledgerSynced: 'LEDGER SYNCHRONIZED',

    // Wallet Card
    availableBalance: 'Available Balance',
    simulatedBalanceNotice: 'Simulation environment • Dual-entry verified',
    vpaHandle: 'VPA Identifier',
    copyVpa: 'Copy VPA',
    vpaCopied: 'VPA Copied to Clipboard!',
    dailySpent: 'Spent Today',
    dailyLimit: 'Daily Limit',
    accountStatus: 'Account Status',
    verifiedKyc: 'KYC VERIFIED',

    // Quick Actions
    actionSend: 'Send Money',
    actionSendDesc: 'Instant UPI-style payment with AI anomaly scoring',
    actionRequest: 'Request Money',
    actionRequestDesc: 'Generate secure payment request or bill split',
    actionScan: 'Scan QR',
    actionScanDesc: 'Scan zero-knowledge encrypted merchant QR code',
    actionAdd: 'Add Money',
    actionAddDesc: 'Simulate instant credit from partner banking node',

    // Spending Analytics
    spendingAnalytics: 'Spending Analytics',
    sevenDaySpending: '7-Day Outflow Velocity',
    spendingByCategory: 'Category Breakdown',
    monthlyBudget: 'Monthly Budget Health',
    food: 'Food & Dining',
    shopping: 'Shopping',
    travel: 'Travel',
    bills: 'Bills & Utilities',
    other: 'Other Transfers',
    budgetUsed: 'of monthly budget spent',
    remainingBudget: 'Remaining',
    budgetRemaining: 'Remaining',

    // Round Up Savings
    roundUpSavings: 'Round-Up Savings',
    roundUpDesc: 'Micro-investing round-up simulation on all settled debits',
    totalSaved: 'Total Auto-Saved',
    qualifyingTxCount: 'qualifying transactions rounded up',
    roundUpExample: 'e.g. ₹450 dinner → ₹500 rounded → ₹50 saved',
    roundUpEnabled: 'Auto Round-Up Active',
    roundUpDisabled: 'Round-Up Paused',

    // Recent Transactions
    recentTransactions: 'Recent Ledger Settlements',
    viewAllTransactions: 'View All Transactions',
    filterAll: 'All',
    filterSafe: 'Verified Safe',
    filterSuspicious: 'Suspicious / Flagged',
    noTransactionsFound: 'No ledger settlements recorded in this partition.',

    // Wallet Protection Widget
    walletProtection: 'Autonomous Defense Posture',
    currentRiskPosture: 'Neural Risk Rating',
    lowRisk: 'LOW RISK (08/100)',
    lastVerification: 'Last Enclave Attestation',
    twoMinAgo: 'Hardware signed 2m ago',
    activeAlerts: 'Active Threats Neutralized',
    zeroThreats: '0 Active Breaches',
    exploreSecurityCentre: 'Open Security Centre',
    inspectAudit: 'Inspect Audit Log',
    unfreezeWallet: 'Unfreeze Wallet',
    freezeWallet: 'Emergency Freeze',

    // Modals
    cancel: 'Cancel',
    confirm: 'Confirm',
    transferAmount: 'Amount in INR (₹)',
    enterRecipientVpa: 'Recipient VPA (@aegis)',
    noteOptional: 'Note (Optional)',
    simulateDeposit: 'Simulate Deposit',
    depositAmount: 'Select Simulation Deposit Amount',
  },
  hi: {
    // Navigation
    overview: 'अवलोकन',
    myWallet: 'मेरा वॉलेट',
    sendMoney: 'पैसे भेजें',
    receiveMoney: 'पैसे मांगें',
    transactions: 'लेन-देन विवरण',
    securityCentre: 'सुरक्षा केंद्र',
    financialInsights: 'वित्तीय विश्लेषण',
    logout: 'लॉगआउट',
    returnHome: 'होम पेज पर लौटें',

    // Dashboard Header
    greetingMorning: 'शुभ प्रभात',
    greetingAfternoon: 'शुभ दोपहर',
    greetingEvening: 'शुभ संध्या',
    securityOverviewSubtitle: 'आपकी वित्तीय सुरक्षा का विस्तृत अवलोकन।',
    walletProtected: 'सुरक्षा शील्ड सक्रिय',
    walletProtectedDetail: 'स्वायत्त एआई सुरक्षा ऑनलाइन है',
    ledgerSynced: 'लेज़र समकालिक',

    // Wallet Card
    availableBalance: 'उपलब्ध शेष राशि',
    simulatedBalanceNotice: 'सिमुलेशन परिवेश • सत्यापित सुरक्षित लेज़र',
    vpaHandle: 'वीपीए पहचानकर्ता',
    copyVpa: 'वीपीए कॉपी करें',
    vpaCopied: 'वीपीए क्लिपबोर्ड पर कॉपी हो गया!',
    dailySpent: 'आज का खर्च',
    dailyLimit: 'दैनिक सीमा',
    accountStatus: 'खाता स्थिति',
    verifiedKyc: 'केवाईसी सत्यापित',

    // Quick Actions
    actionSend: 'पैसे भेजें',
    actionSendDesc: 'एआई जोखिम जांच के साथ तत्काल भुगतान',
    actionRequest: 'पैसे मांगें',
    actionRequestDesc: 'सुरक्षित भुगतान अनुरोध या बिल विभाजन बनाएं',
    actionScan: 'क्यूआर स्कैन करें',
    actionScanDesc: 'सुरक्षित एन्क्रिप्टेड मर्चेंट क्यूआर कोड स्कैन करें',
    actionAdd: 'पैसे जोड़ें',
    actionAddDesc: 'पार्टनर बैंकिंग नोड से सिमुलेटेड जमा राशि जोड़ें',

    // Spending Analytics
    spendingAnalytics: 'खर्च विश्लेषण',
    sevenDaySpending: '7-दिवसीय व्यय प्रवाह',
    spendingByCategory: 'श्रेणीवार खर्च',
    monthlyBudget: 'मासिक बजट स्वास्थ्य',
    food: 'खान-पान',
    shopping: 'शॉपिंग',
    travel: 'यात्रा',
    bills: 'बिल एवं उपयोगिताएं',
    other: 'अन्य स्थानान्तरण',
    budgetUsed: 'मासिक बजट का खर्च हुआ',
    remainingBudget: 'शेष बजट',
    budgetRemaining: 'शेष बजट',

    // Round Up Savings
    roundUpSavings: 'राउंड-अप बचत',
    roundUpDesc: 'प्रत्येक लेनदेन पर स्वतः राउंड-अप बचत सिमुलेशन',
    totalSaved: 'कुल स्वतः बचत',
    qualifyingTxCount: 'लेन-देन राउंड अप किए गए',
    roundUpExample: 'उदा. ₹450 बिल → ₹500 राउंड → ₹50 सुरक्षित बचत',
    roundUpEnabled: 'राउंड-अप सक्रिय',
    roundUpDisabled: 'राउंड-अप रुका हुआ',

    // Recent Transactions
    recentTransactions: 'हालिया लेज़र लेन-देन',
    viewAllTransactions: 'सभी लेन-देन देखें',
    filterAll: 'सभी',
    filterSafe: 'सत्यापित सुरक्षित',
    filterSuspicious: 'संदेहास्पद / अवरुद्ध',
    noTransactionsFound: 'कोई लेन-देन नहीं मिला।',

    // Wallet Protection Widget
    walletProtection: 'स्वायत्त सुरक्षा स्थिति',
    currentRiskPosture: 'एआई जोखिम रेटिंग',
    lowRisk: 'कम जोखिम (08/100)',
    lastVerification: 'अंतिम एन्क्लेव सत्यापन',
    twoMinAgo: 'हार्डवेयर कुंजी 2 मिनट पूर्व सत्यापित',
    activeAlerts: 'सक्रिय खतरे निष्प्रभावी',
    zeroThreats: '0 सक्रिय उल्लंघन',
    exploreSecurityCentre: 'सुरक्षा केंद्र खोलें',
    inspectAudit: 'ऑडिट लॉग देखें',
    unfreezeWallet: 'वॉलेट अनफ्रीज करें',
    freezeWallet: 'आपातकालीन फ्रीज',

    // Modals
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    transferAmount: 'राशि रुपये में (₹)',
    enterRecipientVpa: 'प्राप्तकर्ता वीपीए (@aegis)',
    noteOptional: 'विवरण (वैकल्पिक)',
    simulateDeposit: 'जमा राशि जोड़ें',
    depositAmount: 'सिमुलेशन जमा राशि चुनें',
  },
};
