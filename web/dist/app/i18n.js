// i18n.js — tiny translation helper.
// Usage: t({ en: "Findings", ja: "発見" })  → string in current language
//        t("plain string")                  → returned as-is
// Components subscribe to language changes via window.addEventListener('langchange').

(function () {
  let current = 'en';

  function set(lang) {
    if (lang === current) return;
    current = lang;
    window.dispatchEvent(new Event('langchange'));
  }
  function get() { return current; }

  function t(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') {
      return v[current] != null ? v[current] : (v.en != null ? v.en : (v.ja != null ? v.ja : ''));
    }
    return String(v);
  }

  // UI string bundle — narration-level copy not embedded in scene data.
  const UI = {
    appTitle:        { en: 'Auto Research', ja: '自動リサーチ' },
    appReady:        { en: 'Ready — pick a topic and run', ja: '準備完了 — トピックを選んで実行' },
    openGaps:        { en: 'Open gaps', ja: '未解決の課題' },
    novelTag:        { en: 'novel', ja: 'ノベル' },
    noGapsYet:       { en: 'No gaps yet', ja: '課題はまだありません' },
    noGapsCopy:      { en: 'Findings will be analysed, then opens will appear here as the agent confirms each one.',
                       ja: '発見が分析され、エージェントが確認するごとに未解決の課題がここに表示されます。' },
    research:        { en: 'Auto-Research', ja: '自動リサーチ' },
    heroTitle:       { en: 'What thesis area are you exploring?', ja: 'どの研究テーマを探していますか？' },
    heroSub:         { en: 'Constella will dig through papers, extract findings, run parallel sub-searches, and surface the truly open gaps.',
                       ja: 'Constella が論文を読み込み、知見を抽出し、並列で関連検索を行い、本当に空いている研究課題を浮かび上がらせます。' },
    placeholder:     { en: 'e.g. Self-supervised pretraining for medical imaging',
                       ja: '例：医用画像のための自己教師あり事前学習' },
    run:             { en: 'Run', ja: '実行' },
    tryLabel:        { en: 'Try:', ja: 'お試し：' },
    idle:            { en: 'Idle', ja: '待機中' },
    elapsed:         { en: 's elapsed', ja: '秒経過' },
    statusBoot:      { en: 'Booting Stella agent...', ja: 'Stella エージェントを起動中...' },
    statusSearch:    { en: 'Searching arXiv · OpenReview · Semantic Scholar...', ja: 'arXiv・OpenReview・Semantic Scholar を検索中...' },
    statusExtract:   { en: 'Extracting key findings from each paper...', ja: '各論文から主要な知見を抽出中...' },
    statusSubsearch: { en: 'Running parallel sub-searches for each finding...', ja: '各知見について並列の関連検索を実行中...' },
    statusSynth:     { en: 'Synthesizing analysis across sub-searches...', ja: '関連検索の結果を分析中...' },
    statusGaps:      { en: 'Identifying open gaps in the literature...', ja: '文献中の未解決課題を特定中...' },
    statusInvest:    { en: 'Investigating whether each gap is genuinely open...', ja: '各課題が本当に未解決か検証中...' },
    statusDone:      { en: 'Auto-research complete · compiling report.', ja: '自動リサーチ完了・レポートをまとめています。' },

    // Market-research-specific status copy (used when scene.statusKeys remaps these)
    statusSearchMarket:    { en: 'Listening across Reddit · X · TikTok · Instagram · competitor sites...',
                             ja: 'Reddit・X・TikTok・Instagram・競合サイトを横断的に収集中...' },
    statusExtractMarket:   { en: 'Extracting signals from each post and competitor surface...',
                             ja: '各投稿および競合プロダクトからシグナルを抽出中...' },
    statusSubsearchMarket: { en: 'Running parallel sub-searches across platforms...',
                             ja: '各シグナルについて、プラットフォーム横断の関連検索を実行中...' },
    statusSynthMarket:     { en: 'Triangulating signals across Reddit · X · TikTok · Instagram · competitors...',
                             ja: 'Reddit・X・TikTok・Instagram・競合の各シグナルを統合中...' },
    statusGapsMarket:      { en: 'Identifying unmet needs and competitive whitespace...',
                             ja: '未充足ニーズと競合の空白領域を特定中...' },
    statusInvestMarket:    { en: 'Probing whether each opportunity is genuinely open...',
                             ja: '各機会が本当に空いているかを検証中...' },

    finding:         { en: 'Finding', ja: '発見' },
    paper:           { en: 'Paper', ja: '論文' },
    analysis:        { en: 'Analysis', ja: '分析' },
    gap:             { en: 'Gap', ja: '課題' },
    query:           { en: 'Research Query', ja: '研究クエリ' },
    extractedFrom:   { en: 'extracted from', ja: '出典' },
    noMatching:      { en: 'No matching papers found', ja: '該当する論文なし' },
    investigating:   { en: 'Investigating', ja: '検証中' },
    searching:       { en: 'Searching', ja: '検索中' },
    papersCount:     { en: 'papers', ja: '本の論文' },
    queriesCount:    { en: 'queries', ja: 'クエリ' },
    sourcesCount:    { en: 'sources', ja: '件のソース' },

    gapDetected:     { en: 'Detected', ja: '検出' },
    gapInvest:       { en: 'Investigating', ja: '検証中' },
    gapAddressed:    { en: 'Partially addressed', ja: '部分的に対応済み' },
    gapNovel:        { en: 'Novel direction', ja: '新規方向' },

    reportTitle:     { en: 'Auto-Research · final report', ja: '自動リサーチ · 最終レポート' },
    papersRead:      { en: 'papers read', ja: '本の論文を読了' },
    gapsSurfaced:    { en: 'gaps surfaced', ja: '個の課題を抽出' },
    novelDirections: { en: 'novel directions', ja: '個の新規方向' },
    whatWeDid:       { en: 'What we did', ja: '実施した内容' },
    novelHead:       { en: 'Novel directions worth a thesis', ja: '論文テーマになりうる新規方向' },
    alreadyHead:     { en: 'Already addressed (and replaced)', ja: '既に取り組まれた課題（置き換え済み）' },
    runAgain:        { en: 'Run another query', ja: '別のクエリを実行' },
    openCanvas:      { en: 'Open thesis canvas', ja: '研究キャンバスを開く' },
    sharperGap:      { en: 'derived after one round of investigation — sharper than the original gap.',
                       ja: '一度の検証を経て導出された、より鋭利な課題。' },
    spawnedFrom:     { en: 'spawned from', ja: '派生元' },

    reportL1:        { en: (n) => `Pulled ${n} candidate papers from arXiv, OpenReview, and Semantic Scholar matching the query.`,
                       ja: (n) => `arXiv・OpenReview・Semantic Scholar からクエリに一致する候補論文 ${n} 本を取得。` },
    reportL2:        { en: (n) => `Extracted ${n} key findings, attributing each to the supporting paper and excerpt.`,
                       ja: (n) => `主要な知見 ${n} 件を抽出し、それぞれを出典論文と引用に紐付け。` },
    reportL3:        { en: (n) => `Ran a parallel sub-search per finding (${n} queries total) to validate or contradict it.`,
                       ja: (n) => `各知見について並列の関連検索を実行（計 ${n} クエリ）し、検証または反証。` },
    reportL4:        { en: 'Synthesised an analysis for each finding, then identified one open gap per cluster.',
                       ja: '各知見について分析を統合し、クラスタごとに1つの未解決課題を特定。' },
    reportL5:        { en: 'Investigated each gap with a fresh round of searches; for gaps that turned out to be partially covered, derived a sharper sub-gap and repeated.',
                       ja: '各課題について新たな検索を実行し、部分的に解決済みのものはより鋭利な派生課題を導出して再検証。' },

    // --- Market-research-specific report copy ---
    sourcesRead:           { en: 'sources read',            ja: '件のソースを精読' },
    opportunitiesSurfaced: { en: 'opportunities surfaced',  ja: '個の機会を抽出' },
    wedgeOpportunities:    { en: 'wedge opportunities',     ja: '個の楔となる機会' },
    agentBusinesses:       { en: 'agent businesses to build', ja: '個の構築すべき事業' },
    marketNovelHead:       { en: 'Agent businesses to build now', ja: '今すぐ構築すべきエージェント事業' },
    marketAlreadyHead:     { en: 'Already covered by an existing product', ja: '既存製品で対応済み' },
    implementWithAgents:   { en: 'Implement business plan with agents now',
                             ja: '今すぐエージェントで事業計画を実装' },
    marketReportL1:        { en: (n) => `Pulled ${n} demand-side signals from Reddit, X, TikTok, Instagram, YouTube and competitor surfaces.`,
                             ja: (n) => `Reddit・X・TikTok・Instagram・YouTube・競合プロダクトから需要側シグナル ${n} 件を取得。` },
    marketReportL2:        { en: (n) => `Extracted ${n} cross-platform findings about where agent products would have unfair leverage.`,
                             ja: (n) => `エージェント製品が圧倒的優位を取れる箇所について、プラットフォーム横断の知見 ${n} 件を抽出。` },
    marketReportL3:        { en: (n) => `Ran ${n} parallel sub-searches to verify demand depth and audit competing solutions.`,
                             ja: (n) => `需要の深さの検証と競合監査のため、並列の関連検索を ${n} 件実行。` },
    marketReportL4:        { en: 'Synthesised a verdict per finding, then named the specific competitive whitespace inside it.',
                             ja: '各知見について判定を統合し、その中の具体的な競合空白を特定。' },
    marketReportL5:        { en: 'For each opportunity, named the business: target customer, wedge, pricing model, and addressable ARR.',
                             ja: '各機会について、対象顧客・楔・価格モデル・想定 ARR を備えた具体的事業を立案。' },
  };

  window.t = t;
  window.UI = UI;
  window.lang = { set, get };
})();
