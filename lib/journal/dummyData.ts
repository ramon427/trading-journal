import { Trade, JournalEntry } from '../types/trading';

// Dummy data for demonstration - moved outside component for better performance
export const generateDummyData = () => {
  const dummyTrades: Trade[] = [
    // October 1 - Big win day
    { 
      id: '1', 
      date: '2025-10-01', 
      symbol: 'AAPL', 
      type: 'long', 
      entryPrice: 175.50, 
      exitPrice: 178.20, 
      pnl: 268, 
      rr: 2.7, 
      tags: ['Tech', 'Large Cap'], 
      setup: 'Breakout', 
      notes: 'Clean breakout above resistance with strong volume. Held until target hit.',
      status: 'closed'
    },
    { 
      id: '2', 
      date: '2025-10-01', 
      symbol: 'MSFT', 
      type: 'long', 
      entryPrice: 420.00, 
      exitPrice: 425.50, 
      pnl: 273.50, 
      rr: 2.2, 
      tags: ['Tech', 'Large Cap'], 
      setup: 'Momentum', 
      notes: 'Strong volume confirmed the move. Waited for pullback entry.',
      status: 'closed'
    },
    
    // October 2 - Small loss
    { 
      id: '3', 
      date: '2025-10-02', 
      symbol: 'TSLA', 
      type: 'short', 
      entryPrice: 245.00, 
      exitPrice: 246.20, 
      pnl: -101, 
      rr: -1, 
      tags: ['EV', 'Volatile'], 
      setup: 'Resistance rejection', 
      notes: 'Got stopped out. Market had more strength than expected.',
      status: 'closed'
    },
    { 
      id: '4', 
      date: '2025-10-02', 
      symbol: 'NFLX', 
      type: 'long', 
      entryPrice: 640.00, 
      exitPrice: 655.00, 
      pnl: 375, 
      rr: 3, 
      tags: ['Tech', 'Streaming'], 
      setup: 'Gap fill', 
      notes: 'Perfect gap fill trade. Took profit at resistance.',
      status: 'closed',
      missedTrade: true,
      potentialPnl: 375,
      potentialRR: 3
    },
    
    // October 3 - Break-even day
    { 
      id: '5', 
      date: '2025-10-03', 
      symbol: 'META', 
      type: 'long', 
      entryPrice: 485.00, 
      exitPrice: 485.00, 
      pnl: 0, 
      rr: 0, 
      tags: ['Tech', 'Social Media'], 
      setup: 'Support test', 
      notes: 'No clear direction. Exited at break-even.',
      status: 'closed'
    },
    
    // October 7 - Medium win
    { 
      id: '6', 
      date: '2025-10-07', 
      symbol: 'GOOGL', 
      type: 'long', 
      entryPrice: 155.00, 
      exitPrice: 157.80, 
      pnl: 185.40, 
      rr: 1.8, 
      tags: ['Tech', 'Large Cap'], 
      setup: 'Trend continuation', 
      notes: 'Followed the trend. Clean entry and exit.',
      status: 'closed'
    },
    
    // October 8 - Good win day
    { 
      id: '7', 
      date: '2025-10-08', 
      symbol: 'AAPL', 
      type: 'long', 
      entryPrice: 176.00, 
      exitPrice: 179.50, 
      pnl: 279.50, 
      rr: 3.5, 
      tags: ['Tech', 'Large Cap'], 
      setup: 'Breakout', 
      notes: 'Another great AAPL trade. My best setup continues to work.',
      status: 'closed'
    },
    { 
      id: '8', 
      date: '2025-10-08', 
      symbol: 'AMD', 
      type: 'short', 
      entryPrice: 145.00, 
      exitPrice: 143.50, 
      pnl: 74.50, 
      rr: 1.5, 
      tags: ['Tech', 'Semiconductors'], 
      setup: 'Resistance rejection', 
      notes: 'Quick scalp at resistance.',
      status: 'closed'
    },
    
    // October 9 - Small win day
    { 
      id: '9', 
      date: '2025-10-09', 
      symbol: 'SPY', 
      type: 'long', 
      entryPrice: 450.00, 
      exitPrice: 452.50, 
      pnl: 125, 
      rr: 2.5, 
      tags: ['ETF', 'Index'], 
      setup: 'Support bounce', 
      notes: 'Index support held perfectly.',
      status: 'closed'
    },
    { 
      id: '10', 
      date: '2025-10-09', 
      symbol: 'NFLX', 
      type: 'long', 
      entryPrice: 650.00, 
      exitPrice: 655.00, 
      pnl: 99, 
      rr: 2.5, 
      tags: ['Tech', 'Streaming'], 
      setup: 'Momentum', 
      notes: 'Caught the trend early. Rode it until momentum faded.',
      status: 'closed'
    },
    { 
      id: '11', 
      date: '2025-10-09', 
      symbol: 'AMZN', 
      type: 'short', 
      entryPrice: 178.00, 
      exitPrice: 176.50, 
      pnl: 59.20, 
      rr: 1.5, 
      tags: ['Tech', 'E-commerce'], 
      setup: 'Resistance', 
      notes: 'Rejection at key resistance level. Short worked perfectly.',
      status: 'closed'
    },
    
    // October 10 - Medium loss
    { 
      id: '12', 
      date: '2025-10-10', 
      symbol: 'JPM', 
      type: 'long', 
      entryPrice: 190.00, 
      exitPrice: 187.50, 
      pnl: -151.20, 
      rr: -1.25, 
      tags: ['Finance', 'Banking'], 
      setup: 'Support bounce', 
      notes: 'Support level broke down. Followed my stop loss rule. Not all setups work.',
      status: 'closed'
    },
    
    // October 11 - News day, no system, loss
    { 
      id: '13', 
      date: '2025-10-11', 
      symbol: 'SPY', 
      type: 'long', 
      entryPrice: 455.00, 
      exitPrice: 452.00, 
      pnl: -301.50, 
      rr: -3, 
      tags: ['ETF', 'Index', 'Mistake'], 
      setup: 'FOMO', 
      notes: 'FOMC day - I knew better but traded anyway. Chased the move and paid the price. Lesson learned.',
      status: 'closed'
    },
    
    // October 14 - Good win
    { 
      id: '14', 
      date: '2025-10-14', 
      symbol: 'AAPL', 
      type: 'long', 
      entryPrice: 180.00, 
      exitPrice: 183.50, 
      pnl: 278.40, 
      rr: 3.5, 
      tags: ['Tech', 'Large Cap'], 
      setup: 'Trend continuation', 
      notes: 'Beautiful trend continuation setup. Great follow-through after consolidation.',
      status: 'closed'
    },
    
    // October 15 - Small win
    { 
      id: '15', 
      date: '2025-10-15', 
      symbol: 'TSLA', 
      type: 'long', 
      entryPrice: 250.00, 
      exitPrice: 252.00, 
      pnl: 98.75, 
      rr: 1.33, 
      tags: ['EV', 'Volatile'], 
      setup: 'Consolidation breakout', 
      notes: 'Took profit a bit early but secured the win. Green is green.',
      status: 'closed'
    },
    
    // October 16 - Big loss day
    { 
      id: '16', 
      date: '2025-10-16', 
      symbol: 'NVDA', 
      type: 'long', 
      entryPrice: 880.00, 
      exitPrice: 865.00, 
      pnl: -376, 
      rr: -3, 
      tags: ['Tech', 'AI', 'Semiconductors'], 
      setup: 'Breakout', 
      notes: 'False breakout. Market reversed quickly. Tough day but stuck to my stop loss.',
      status: 'closed'
    },
    { 
      id: '17', 
      date: '2025-10-16', 
      symbol: 'TSLA', 
      type: 'long', 
      entryPrice: 252.00, 
      exitPrice: 248.00, 
      pnl: -201, 
      rr: -2, 
      tags: ['EV', 'Volatile'], 
      setup: 'FOMO', 
      notes: 'Tried to revenge trade after NVDA loss. This is exactly what I should NOT do. Lesson: walk away after a loss.',
      status: 'closed'
    },
    
    // October 17 - Recovery day
    { 
      id: '18', 
      date: '2025-10-17', 
      symbol: 'AAPL', 
      type: 'long', 
      entryPrice: 181.00, 
      exitPrice: 183.50, 
      pnl: 198.50, 
      rr: 2.5, 
      tags: ['Tech', 'Large Cap'], 
      setup: 'Breakout', 
      notes: 'Back to basics. Waited for my A+ setup and executed flawlessly.',
      status: 'closed'
    },
    
    // October 18 - Small win
    { 
      id: '19', 
      date: '2025-10-18', 
      symbol: 'MSFT', 
      type: 'long', 
      entryPrice: 428.00, 
      exitPrice: 430.50, 
      pnl: 124.25, 
      rr: 2.5, 
      tags: ['Tech', 'Large Cap'], 
      setup: 'Momentum', 
      notes: 'Strong tech day. MSFT trending nicely.',
      status: 'closed'
    },
  ];

  const dummyJournalEntries: JournalEntry[] = [
    {
      date: '2025-10-01',
      name: 'Perfect Start to October',
      mood: 'excellent',
      notes: '<p>Started the month strong with two solid winners. Both AAPL and MSFT showed great setups and I executed my plan perfectly.</p><p>Key takeaway: Patience pays off. Waited for confirmation before entering.</p>',
      lessonsLearned: 'When the setup is perfect, don\'t hesitate. Trust your system.',
      marketConditions: 'Bullish trend continuation. Tech sector leading.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: true,
      newsEvents: [
        { name: 'NFP Report', time: '8:30 AM' },
        { name: 'ISM Manufacturing', time: '10:00 AM' }
      ]
    },
    {
      date: '2025-10-02',
      mood: 'good',
      notes: '<p>Mixed day with one loss and one missed opportunity. TSLA stopped me out, but I kept my loss small by following my rules.</p>',
      lessonsLearned: 'Losses happen. The key is keeping them small and not letting them affect the next trade.',
      marketConditions: 'Choppy. Mixed signals across sectors.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: false,
    },
    {
      date: '2025-10-03',
      mood: 'neutral',
      notes: '<p>Break-even day with META. Market was indecisive. Better to exit flat than force a win that isn\'t there.</p>',
      lessonsLearned: 'Sometimes the best trade is no trade (or a break-even exit).',
      marketConditions: 'Sideways action. Low conviction.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: true,
      newsEvents: [
        { name: 'CPI Data', time: '8:30 AM' }
      ]
    },
    {
      date: '2025-10-07',
      mood: 'good',
      notes: '<p>Solid GOOGL trade following the uptrend. Trend is my friend!</p>',
      lessonsLearned: 'Trend continuation setups are my bread and butter.',
      marketConditions: 'Strong uptrend in tech. Following the momentum.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: false,
    },
    {
      date: '2025-10-08',
      mood: 'excellent',
      notes: '<p>Great day! Two wins with AAPL and AMD. AAPL breakout was textbook. AMD resistance rejection worked perfectly for a quick scalp.</p>',
      lessonsLearned: 'My breakout and resistance setups are working well. Stick with what I know.',
      marketConditions: 'Volatile but trending. Clear levels to trade.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: true,
      newsEvents: [
        { name: 'EIA', time: '10:30 AM' },
        { name: 'Agricultural Report', time: '3:00 PM' }
      ]
    },
    {
      date: '2025-10-09',
      mood: 'good',
      notes: '<p>Three small winners. SPY support bounce, NFLX momentum, and AMZN resistance short. Diverse setups all worked.</p>',
      lessonsLearned: 'Multiple small wins add up. Don\'t need home runs every day.',
      marketConditions: 'Range-bound but with clear support/resistance levels.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: false,
    },
    {
      date: '2025-10-10',
      mood: 'neutral',
      notes: '<p>Lost on JPM when support broke. Followed my stop loss rule and kept the loss manageable.</p>',
      lessonsLearned: 'Not every support level holds. That\'s why we have stops.',
      marketConditions: 'Weakness in financials. Should have noticed the sector rotation.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: false,
    },
    {
      date: '2025-10-11',
      mood: 'poor',
      notes: '<p>Big mistake. Traded on FOMC day despite my rule against it. Got caught in the volatility and took a significant loss.</p>',
      lessonsLearned: 'NEVER trade on major news days. My system works in normal market conditions, not during high-impact events.',
      marketConditions: 'Extreme volatility due to FOMC. Unpredictable moves.',
      didTrade: true,
      followedSystem: false,
      isNewsDay: true,
      newsEvents: [
        { name: 'FOMC Minutes', time: '12:00 PM' },
        { name: 'Powell Speech', time: '2:30 PM' }
      ]
    },
    {
      date: '2025-10-14',
      mood: 'excellent',
      notes: '<p>Back on track with a beautiful AAPL trend continuation. This is what happens when I wait for my A+ setups.</p>',
      lessonsLearned: 'Quality over quantity. One great trade beats multiple mediocre ones.',
      marketConditions: 'Strong uptrend resuming after consolidation.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: true,
      newsEvents: [
        { name: 'Retail Sales', time: '8:30 AM' },
        { name: 'Fed Beige Book', time: '2:00 PM' }
      ]
    },
    {
      date: '2025-10-15',
      mood: 'good',
      notes: '<p>Small win with TSLA. Took profit a bit early but that\'s okay. A win is a win.</p>',
      lessonsLearned: 'Don\'t regret taking profit. You can\'t go broke taking gains.',
      marketConditions: 'Choppy but TSLA showing strength.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: false,
    },
    {
      date: '2025-10-16',
      mood: 'terrible',
      notes: '<p>Rough day. Lost on NVDA false breakout, then compounded it with a revenge trade on TSLA. This is exactly what I teach myself NOT to do.</p><p>After the NVDA loss, I should have walked away. Instead, I let emotions drive my decision and forced a trade that wasn\'t there.</p>',
      lessonsLearned: 'Rule #1: Never revenge trade. Rule #2: When you break Rule #1, the market will punish you. Walk away after a loss to reset mentally.',
      marketConditions: 'Choppy and unpredictable. Many false breakouts.',
      didTrade: true,
      followedSystem: false,
      isNewsDay: false,
    },
    {
      date: '2025-10-17',
      mood: 'good',
      notes: '<p>Redemption! Took a day to reset after yesterday\'s disaster. Waited patiently for my best setup (AAPL breakout) and executed perfectly.</p>',
      lessonsLearned: 'The market will always be there tomorrow. It\'s okay to take a break to reset your mindset.',
      marketConditions: 'Cleaner price action. Trending nicely.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: false,
    },
    {
      date: '2025-10-18',
      mood: 'good',
      notes: '<p>Solid MSFT momentum trade. Back to consistent execution.</p>',
      lessonsLearned: 'Consistency is key. Trust the process.',
      marketConditions: 'Strong tech sector momentum.',
      didTrade: true,
      followedSystem: true,
      isNewsDay: false,
    },
  ];

  return { dummyTrades, dummyJournalEntries };
};
