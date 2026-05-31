// scenes.js — four research topics with real papers (titles, authors, venues, years).
// Narration fields ({en, ja}) get translated; paper metadata stays English.

const SCENES = {
  // ===========================================================================
  market: {
    kind: 'market',
    label: { en: 'Agent businesses to build', ja: '構築すべき AI エージェント事業' },
    query: {
      en: 'Which AI-agent businesses should we build right now?',
      ja: '今すぐ構築すべき AI エージェント事業はどれか？'
    },
    statusKeys: {
      statusSearch:    'statusSearchMarket',
      statusExtract:   'statusExtractMarket',
      statusSubsearch: 'statusSubsearchMarket',
      statusSynth:     'statusSynthMarket',
      statusGaps:      'statusGapsMarket',
      statusInvest:    'statusInvestMarket',
    },
    unitKeys: {
      papersCount:  'sourcesCount',
      queriesCount: 'queriesCount',
    },
    reportKeys: {
      papersRead:      'sourcesRead',
      gapsSurfaced:    'opportunitiesSurfaced',
      novelDirections: 'agentBusinesses',
      reportL1: 'marketReportL1',
      reportL2: 'marketReportL2',
      reportL3: 'marketReportL3',
      reportL4: 'marketReportL4',
      reportL5: 'marketReportL5',
      novelHead: 'marketNovelHead',
      alreadyHead: 'marketAlreadyHead',
      novelCtaLabel: 'implementWithAgents',   // adds CTA button per result
    },
    seeds: [
      { id:'p1', source:'reddit',
        authors:'u/owns_a_plumbing_shop', year:'2026', venue:'r/smallbusiness · 4.1k upvotes',
        title:'I work 50 hrs in the field and 20 more at home doing the office. Every "trades software" is a CRM bolted to an invoice tool.',
        bubbles:['50 hrs field','20 hrs admin','no software helps'],
        excerpt:{
          en:'None of them actually DO the work — confirming appointments, calling for past-due, filing permits, ordering parts. I want the office manager I cannot afford, not another dashboard.',
          ja:'予約確認・延滞催促・許可申請・部品発注まで、実務を「やってくれる」ソフトは皆無。雇えない事務員代行が欲しいのであって、もう一つのダッシュボードではない。'
        }},
      { id:'p2', source:'x',
        authors:'@jasonlk · SaaStr', year:'2026', venue:'18.4K likes · 2.1K reposts',
        title:'The next $10B vertical SaaS plays are agents that DO the workflow, not dashboards that show it. AR collections, prior auth, permit filing, appeals — all 95% rule-based, done today by $40/hr humans.',
        bubbles:['$10B verticals','95% rule-based','$40/hr humans'],
        excerpt:{
          en:'If you can ship one reliable vertical agent that actually replaces the work, you can name your price. Nobody loves the humans doing this today — they are stretched, expensive, and inconsistent.',
          ja:'実務を本当に肩代わりする縦割りエージェントを一つでも安定供給できれば、価格は自由に付けられる。今その業務をしている人を誰も愛してはいない — 人手は逼迫し、コストは高く、品質も不安定。'
        }},
      { id:'p3', source:'tiktok',
        authors:'@adhd_taxes_help', year:'2026', venue:'2.4M views · 11K comments',
        title:'POV: that medical bill has been in your "fight later" inbox for 8 months and the appeal window closes next week',
        bubbles:['2.4M views','11K comments','fight-later purgatory'],
        excerpt:{
          en:'Comments are flooded with people who gave up on insurance appeals worth $500-$8,000. The top reply has 47K likes and says "I would pay 25% to never speak to a payor on the phone again."',
          ja:'コメント欄は 500〜8,000 ドル分の保険異議申立を諦めた人々で溢れている。トップコメント（4.7 万いいね）：「保険会社と二度と電話で話さずに済むなら、回収額の 25% を喜んで払う。」'
        }},
      { id:'p4', source:'instagram',
        authors:'@bluecollarmillionaire', year:'2026', venue:'180K followers · reel',
        title:'How a $4M/yr fence company actually runs its back office (this is why "trades SaaS" never lands)',
        bubbles:['paper permits','sticky notes','no software fits'],
        excerpt:{
          en:'60-second walkthrough of paper permits, sticky-note dispatch, a whiteboard for crew assignments, and three different apps. Caption: "trades work is calls and paperwork, not clicks. Whoever fixes the phone-and-paperwork half owns this industry."',
          ja:'紙の許可証・付箋によるディスパッチ・班割りのホワイトボード・別々のアプリ3本を60秒で紹介。キャプション：「現場仕事は電話と書類であってクリックではない。電話と書類の半分を直した者がこの産業を握る。」'
        }},
    ],
    findings: [
      {
        id:'f1', from:['p1','p4'], sourcePaper:'p1',
        title:{ en:'The "office manager" role at vertical SMBs is the highest-leverage agent target on the board',
                ja:'縦割り中小企業の「事務員」ロールが、現時点で最もレバレッジの効くエージェント対象' },
        excerpt:{ en:'…I want the office manager I cannot afford, not another dashboard…',
                  ja:'…雇えない事務員代行が欲しいのであって、もう一つのダッシュボードではない…' },
        subSearch:{
          papers:[
            { id:'sp1a', source:'reddit',     authors:'r/HVAC · 28 threads · 90 days',  title:'"Office manager just quit, drowning in calls" — recurring' },
            { id:'sp1b', source:'competitor', authors:'ServiceTitan · feature audit',   title:'$398/mo SaaS, still requires 1.5 FTE office staff' },
            { id:'sp1c', source:'youtube',    authors:'Trades-business YouTube · 4 chans', title:'Top complaint: "answering the phone is the bottleneck"' },
          ],
          analysis:{
            id:'a1', tone:'good',
            verdict:{ en:'Confirmed across vertical + buyer', ja:'業種・購買者の両面で確認済み' },
            body:{ en:'700K US trades shops × $55K median office-manager salary = $38.5B labor pool. Every shipped SaaS still requires the human to operate it. Replacing the role, not the screen, is the win.',
                   ja:'米国の現場業者 70 万件 × 事務員年収中央値 5.5 万ドル＝ 385 億ドルの人件費プール。既存 SaaS はどれも人が操作する前提。画面ではなくロール自体を置き換えることが勝ち筋。' },
          },
          gap:{
            id:'g1',
            title:{ en:'No agent product replaces the *role* — every competitor still sells dashboards',
                    ja:'役割そのものを置き換えるエージェント製品が存在しない — 競合は依然としてダッシュボードを販売中' },
            why:{ en:'ServiceTitan, Housecall Pro, Jobber all show you AR, dispatch, and permits. None pick up the phone, file the permit, or call the customer. The wedge is doing the work, not visualising it.',
                  ja:'ServiceTitan・Housecall Pro・Jobber はいずれも AR・配車・許可を「表示」するが、電話に出ず・許可申請も代行せず・顧客に架電もしない。可視化ではなく「実行」が楔。' },
            investigation:{
              papers:[
                { id:'i1a', source:'competitor', authors:'Decagon, Sierra, Ada · audit', title:'All horizontal CX — none vertical to trades' },
                { id:'i1b', source:'reddit',     authors:'r/Plumbing · "tried 6 tools"', title:'Recurring: "they all just help me, none replace her"' },
              ],
              analysis:{
                id:'ia1', tone:'novel',
                verdict:{ en:'Greenfield', ja:'未開拓' },
                body:{ en:'No funded startup is shipping a role-replacement agent for trades back-office. Closest analogues (Decagon/Sierra) sell horizontal CX to mid-market. Clear lane.',
                       ja:'現場業者の事務員役割を置き換えるエージェントを出荷する資金調達済みスタートアップは存在しない。最も近い類例（Decagon・Sierra）は中堅向け汎用 CX。明確な空きレーン。' },
              },
            },
          },
        },
      },
      {
        id:'f2', from:['p2','p3'], sourcePaper:'p3',
        title:{ en:'Insurance & medical appeals are statistically winnable but >70% of consumers give up',
                ja:'保険・医療の異議申立は統計的に勝てるのに、消費者の 7 割以上が途中で諦める' },
        excerpt:{ en:'…I would pay 25% to never speak to a payor on the phone again…',
                  ja:'…保険会社と二度と電話で話さずに済むなら、回収額の 25% を喜んで払う…' },
        subSearch:{
          papers:[
            { id:'sp2a', source:'reddit',     authors:'r/HealthInsurance · top 50',     title:'Appeal-win rate is 62% if filed; 8% bother filing' },
            { id:'sp2b', source:'x',          authors:'@ProPublica thread · 9.3K rt',   title:'$2,400 median denial · 5.3 mins to overturn with template' },
            { id:'sp2c', source:'competitor', authors:'Claimable, Counterforce · audit', title:'B2B-only · no take-rate consumer product exists' },
          ],
          analysis:{
            id:'a2', tone:'good',
            verdict:{ en:'Demand + arbitrage confirmed', ja:'需要とアービトラージの双方を確認' },
            body:{ en:'Median consumer appeal worth $2,400, success rate 62% when filed, only ~8% are filed. Existing tools (Claimable, Counterforce) chase hospitals not patients. Take-rate pricing is the wedge.',
                   ja:'消費者の異議申立の中央値 2,400 ドル、申立時の成功率 62%、実際に申立されるのはおよそ 8% のみ。既存ツール（Claimable・Counterforce）は病院向けで、患者向け回収料率モデルは未踏。' },
          },
          gap:{
            id:'g2',
            title:{ en:'No consumer-facing appeals agent priced on % of recovery has launched',
                    ja:'消費者向けに「回収額の％」で課金する異議申立エージェントは未上市' },
            why:{ en:'Payor-side workflow is well-understood, templates exist, win-rate is measurable. The blocker is GTM courage — nobody wants to be paid only when they win.',
                  ja:'保険会社側のワークフローは既知、テンプレートも存在、勝率も計測可能。ボトルネックは GTM の覚悟 — 「勝った時だけ報酬」を引き受ける企業がいない。' },
            investigation:{
              papers:[
                { id:'i2a', source:'competitor', authors:'—', title:{ en:'No matching product', ja:'該当製品なし' } },
              ],
              analysis:{
                id:'ia3', tone:'novel',
                verdict:{ en:'Greenfield · consumer take-rate', ja:'未開拓 · 消費者回収料率' },
                body:{ en:'A "we only charge if we win, 25% of recovered amount" appeals agent has no shipped competitor. Self-serve onboarding, payor APIs, faxable templates — all available.',
                       ja:'「勝った時のみ 25%」型の異議申立エージェントは出荷競合なし。セルフサーブ導線、保険会社 API、FAX 送付テンプレートはすべて利用可能。' },
              },
            },
          },
        },
      },
      {
        id:'f3', from:['p2'], sourcePaper:'p2',
        title:{ en:'Performance-priced agents (% of recovered/saved $) are an untouched pricing wedge',
                ja:'成果報酬型エージェント（回収額・節約額の％課金）は手付かずの価格戦略' },
        excerpt:{ en:'…you can name your price. Nobody loves the humans doing this today…',
                  ja:'…価格は自由に付けられる。今その業務をしている人を誰も愛してはいない…' },
        subSearch:{
          papers:[
            { id:'sp3a', source:'competitor', authors:'Top 20 agent startups · pricing', title:'19/20 priced per-seat or per-resolution' },
            { id:'sp3b', source:'youtube',    authors:'a16z partner talk · 92K views',   title:'"Outcome-priced AI is undermonetised — by 10x"' },
            { id:'sp3c', source:'reddit',     authors:'r/SaaS · 6 threads',              title:'SMB owners prefer % over seats — measurable ROI' },
          ],
          analysis:{
            id:'a3', tone:'good',
            verdict:{ en:'Wedge confirmed across analyst + customer', ja:'アナリストと顧客の双方で確認済み' },
            body:{ en:'19/20 funded agent startups use SaaS pricing. SMBs prefer outcome-priced. Performance pricing on AR collections, claims, refunds and chargebacks is a clean wedge against incumbents.',
                   ja:'資金調達済みエージェント企業 20 社中 19 社が SaaS 課金。中小企業は成果報酬型を好む。AR 回収・請求・返金・チャージバックでの成果報酬は既存勢への明確な楔。' },
          },
          gap:{
            id:'g3',
            title:{ en:'A/R collections for trades & healthcare priced as % of recovered $ is unbuilt',
                    ja:'現場業者・医療向けの A/R 回収を「回収額の％」で課金する製品は未構築' },
            why:{ en:'ServiceTitan and Tebra report AR; they do not collect it. The collection itself is calls, texts, and small-claims-court filings — all agent-shaped work, all measurable.',
                  ja:'ServiceTitan・Tebra は AR を「報告」するが「回収」はしない。実際の回収は電話・SMS・少額訴訟申立 — すべてエージェント向きの業務で、すべて計測可能。' },
            investigation:{
              papers:[
                { id:'i3a', source:'competitor', authors:'Resolve, Upflow · audit', title:'B2B AR SaaS · per-seat, no agent execution' },
              ],
              analysis:{
                id:'ia4', tone:'mixed',
                verdict:{ en:'Adjacent precedent only', ja:'隣接の前例のみ' },
                body:{ en:'Resolve and Upflow are dashboards. Neither makes the call, sends the demand letter, or files the small-claims case. Performance-priced agent has no shipped equivalent.',
                       ja:'Resolve・Upflow はダッシュボード。電話発信・督促状送付・少額訴訟申立のいずれも実行しない。成果報酬型エージェントの出荷例は存在しない。' },
              },
              newGap:{
                id:'g3b',
                title:{ en:'AR-collection agent for trades, priced as 4% of $ recovered on >90-day accounts',
                        ja:'90日超の未回収について「回収額の 4%」課金で動く、現場業者向け AR 回収エージェント' },
                investigation:{
                  papers:[
                    { id:'i3b', source:'competitor', authors:'—', title:{ en:'No competitor in this lane', ja:'この領域に競合なし' } },
                  ],
                  analysis:{
                    id:'ia5', tone:'novel',
                    verdict:{ en:'Wedge opportunity', ja:'楔となる機会' },
                    body:{ en:'700K trades shops × $42K avg >90-day AR × 4% take = $1.2B addressable ARR before expanding to dental & vet. Buildable in 6 months with current models + Twilio + court e-filing APIs.',
                           ja:'米国の現場業者 70 万件 × 90日超 AR 平均 4.2 万ドル × 料率 4%＝ 12 億ドルの想定 ARR（歯科・動物病院展開前）。現行モデル＋Twilio＋裁判所 e-filing API で 6 か月で構築可能。' },
                  },
                },
              },
            },
          },
        },
      },
    ],
    // --- Per-novel-direction "business plan" payload used by the report card.
    // Lookup is by gap id; only "novel" gaps need this.
    plans: {
      g1: {
        name: { en:'Foreman', ja:'Foreman' },
        wedge: { en:'AI office manager that picks up the phone, confirms jobs, files permits, and chases AR — replaces a $55K role at $1,400/mo per shop.',
                 ja:'電話に出て・予約を確定し・許可を申請し・未回収を追う AI 事務員。年収 5.5 万ドルの役割を、月額 1,400 ドル／店舗で置き換える。' },
        facts: [
          { en:'700K US trades shops', ja:'米国に 70 万店舗' },
          { en:'$38.5B labor pool', ja:'人件費プール 385 億ドル' },
          { en:'Per-shop subscription', ja:'店舗単位サブスク' },
          { en:'Twilio · permit APIs · payor faxes', ja:'Twilio・許可 API・FAX 連携' },
        ],
      },
      g2: {
        name: { en:'Refund', ja:'Refund' },
        wedge: { en:'Consumer-facing insurance & medical-bill appeals agent. We charge 25% of what we recover — and only if we win.',
                 ja:'消費者向け保険・医療請求の異議申立エージェント。回収額の 25% のみを成果報酬で受け取る — 勝った時だけ請求。' },
        facts: [
          { en:'$2,400 median denial', ja:'拒否額の中央値 2,400 ドル' },
          { en:'62% win-rate when filed', ja:'申立時の勝率 62%' },
          { en:'~8% of denials are appealed', ja:'拒否のうち申立は約 8%' },
          { en:'25% take-rate · no-win-no-fee', ja:'回収料率 25%・敗訴時無料' },
        ],
      },
      g3b: {
        name: { en:'TerminalAR', ja:'TerminalAR' },
        wedge: { en:'A/R collection agent for trades, dental, and vet shops. We call, text, demand-letter, and file small-claims — priced at 4% of every dollar recovered.',
                 ja:'現場業者・歯科・動物病院向け A/R 回収エージェント。架電・SMS・督促状・少額訴訟申立を代行し、回収額の 4% を成果報酬で受け取る。' },
        facts: [
          { en:'$1.2B addressable ARR', ja:'想定 ARR 12 億ドル' },
          { en:'4% of $ recovered', ja:'回収額の 4%' },
          { en:'Buildable in 6 months', ja:'6 か月で構築可' },
          { en:'Twilio · e-filing · KYB', ja:'Twilio・電子訴訟・法人確認 API' },
        ],
      },
    },
  },

  // ===========================================================================
  gsplat: {
    label: { en: '3D Gaussian Splatting', ja: '3D ガウシアンスプラッティング' },
    query: { en: '3D Gaussian Splatting for novel view synthesis',
             ja: '新規視点合成のための 3D ガウシアンスプラッティング' },
    seeds: [
      { id:'p1', authors:'Kerbl, Kopanas, Leimkühler, Drettakis', year:2023, venue:'SIGGRAPH',
        title:'3D Gaussian Splatting for Real-Time Radiance Field Rendering',
        excerpt:{ en:'Anisotropic 3D Gaussians reach SOTA quality on Mip-NeRF360 while rendering at >100 FPS on a single GPU.',
                  ja:'異方性 3D ガウシアンが単一 GPU で 100 FPS 超を達成しつつ Mip-NeRF360 で最高品質に到達。' } },
      { id:'p2', authors:'Yu, Chen, Antic, Mihajlovic, et al.', year:2024, venue:'CVPR',
        title:'Mip-Splatting: Alias-free 3D Gaussian Splatting',
        excerpt:{ en:'A 3D smoothing filter caps each Gaussian\'s frequency, eliminating zoom-out artefacts while preserving sharpness.',
                  ja:'3D 平滑化フィルタが各ガウシアンの周波数を制限し、ズームアウト時のアーティファクトを解消。' } },
      { id:'p3', authors:'Huang, Yu, Chen, Huang, Gao', year:2024, venue:'SIGGRAPH',
        title:'2D Gaussian Splatting for Geometrically Accurate Radiance Fields',
        excerpt:{ en:'Flat 2D disks aligned to surfaces give multiview-consistent depth and reconstructed meshes 3× more accurate than 3DGS.',
                  ja:'表面に整列した2D円盤がマルチビュー整合な深度を与え、3DGS の3倍精度のメッシュを再構成。' } },
      { id:'p4', authors:'Wu, Yi, Fang, et al.', year:2024, venue:'CVPR',
        title:'4D Gaussian Splatting for Real-Time Dynamic Scene Rendering',
        excerpt:{ en:'A HexPlane-style deformation field on canonical Gaussians yields 82 FPS on dynamic scenes at 800×800.',
                  ja:'カノニカルガウシアンに HexPlane 型の変形場を適用し、動的シーンを 800×800 で 82 FPS で描画。' } },
    ],
    findings: [
      {
        id:'f1', from:['p1','p2'],
        sourcePaper:'p2',
        title:{ en:'Frequency-aware filtering is necessary to avoid aliasing in 3DGS',
                ja:'3DGS のエイリアシング回避には周波数フィルタが必須' },
        excerpt:{ en:'…3D smoothing filter caps each Gaussian\'s frequency…', ja:'…3D 平滑化フィルタが各ガウシアンの周波数を制限…' },
        subSearch:{
          papers:[
            { id:'sp1a', authors:'Yan et al. 2024', title:'Multi-Scale 3DGS (CVPR)' },
            { id:'sp1b', authors:'Liang et al. 2024', title:'Analytic-Splatting (ECCV)' },
            { id:'sp1c', authors:'Song et al. 2024', title:'SA-GS: Scale-Adaptive 3DGS' },
          ],
          analysis:{
            id:'a1', tone:'good',
            verdict:{ en:'Confirmed (3/3)', ja:'確認済み (3/3)' },
            body:{ en:'All three independently introduce scale- or frequency-aware filters and report PSNR gains of 1–3 dB at zoomed-out views.',
                   ja:'三件とも独自にスケール・周波数フィルタを導入し、ズームアウト時に PSNR 1〜3 dB の改善を報告。' },
          },
          gap:{
            id:'g1',
            title:{ en:'No principled treatment of temporal aliasing in 4D Gaussian Splatting',
                    ja:'4D ガウシアンスプラッティングにおける時間的エイリアシングへの体系的対処の不在' },
            why:{ en:'Spatial aliasing is solved; fast camera motion + low-FPS captures still produce strobing artefacts in 4D scenes.',
                  ja:'空間的エイリアシングは解決済みだが、高速カメラ移動・低 FPS 撮影では 4D シーンにストロボ状の不具合が残る。' },
            investigation:{
              papers:[
                { id:'i1a', authors:'Zhang et al. 2024', title:'Temporal Consistency in 4DGS' },
                { id:'i1b', authors:'Park et al. 2025', title:'Motion-aware Splatting' },
              ],
              analysis:{
                id:'ia1', tone:'mixed',
                verdict:{ en:'Partial coverage', ja:'部分的に対応済み' },
                body:{ en:'Zhang regularises temporal smoothness; Park introduces motion priors. Neither analyses Nyquist limits in time.',
                       ja:'Zhang は時間的滑らかさを正則化し、Park は動きの事前分布を導入。だが時間軸のナイキスト限界は未分析。' },
              },
              newGap:{
                id:'g1b',
                title:{ en:'Nyquist-aware temporal filter for 4DGS at low capture rates',
                        ja:'低フレームレート撮影下の 4DGS におけるナイキスト準拠の時間フィルタ' },
                investigation:{
                  papers:[
                    { id:'i1c', authors:'—', title:{ en:'No matching papers found', ja:'該当する論文なし' } },
                  ],
                  analysis:{
                    id:'ia2', tone:'novel',
                    verdict:{ en:'Novel direction', ja:'新規方向' },
                    body:{ en:'No published work derives a temporal Nyquist condition for Gaussian primitives. Concrete, tractable thesis problem.',
                           ja:'ガウシアン基本形に対する時間的ナイキスト条件を導出した既存研究は皆無。具体的かつ取り組み可能な研究テーマ。' },
                  },
                },
              },
            },
          },
        },
      },
      {
        id:'f2', from:['p3'], sourcePaper:'p3',
        title:{ en:'Surface-aligned 2D primitives recover geometry far better than 3D Gaussians',
                ja:'表面整列 2D 基本形は 3D ガウシアンより遥かに高精度な形状を復元する' },
        excerpt:{ en:'…reconstructed meshes 3× more accurate than 3DGS…', ja:'…3DGS の3倍精度のメッシュを再構成…' },
        subSearch:{
          papers:[
            { id:'sp2a', authors:'Guédon & Lepetit 2024', title:'SuGaR: Surface-aligned Gaussians' },
            { id:'sp2b', authors:'Lyu et al. 2024',       title:'PGSR: Planar Gaussian SR' },
            { id:'sp2c', authors:'Dai et al. 2024',        title:'Gaussian Surfels (SIGGRAPH)' },
          ],
          analysis:{
            id:'a2', tone:'good',
            verdict:{ en:'Confirmed across methods', ja:'各手法で確認済み' },
            body:{ en:'Three independent reformulations toward planar or surfel primitives all improve Chamfer distance by 2–4×.',
                   ja:'平面・サーフェル基本形への三件の独立した再定式化が、いずれも Chamfer 距離を 2〜4 倍改善。' },
          },
          gap:{
            id:'g2',
            title:{ en:'2DGS unexplored for transparent and refractive surfaces',
                    ja:'透明・屈折面に対する 2DGS は未開拓' },
            why:{ en:'All evaluations use opaque objects; glass, water, and lenses violate the surface-disk assumption.',
                  ja:'評価はすべて不透明物体。ガラス・水・レンズは表面ディスク仮定を破る。' },
            investigation:{
              papers:[
                { id:'i2a', authors:'—', title:{ en:'No prior comparison found', ja:'先行する比較研究なし' } },
              ],
              analysis:{
                id:'ia3', tone:'novel',
                verdict:{ en:'Novel direction', ja:'新規方向' },
                body:{ en:'No paper extends 2DGS or surfels to transparent media. A volumetric–surface hybrid is unexplored.',
                       ja:'2DGS・サーフェルを透明媒質に拡張した論文は存在せず、体積–表面ハイブリッドは未開拓。' },
              },
            },
          },
        },
      },
      {
        id:'f3', from:['p1','p4'], sourcePaper:'p4',
        title:{ en:'Dynamic 4DGS scales poorly to long sequences and multi-actor scenes',
                ja:'動的 4DGS は長時間列・複数人物シーンへのスケールが困難' },
        excerpt:{ en:'…82 FPS on dynamic scenes at 800×800…', ja:'…800×800 で 82 FPS の動的シーン描画…' },
        subSearch:{
          papers:[
            { id:'sp3a', authors:'Yang et al. 2024', title:'Deformable 3D Gaussians (CVPR)' },
            { id:'sp3b', authors:'Luiten et al. 2024', title:'Dynamic 3DGS for Tracking (3DV)' },
            { id:'sp3c', authors:'Pan et al. 2025', title:'HumanSplat (NeurIPS)' },
          ],
          analysis:{
            id:'a3', tone:'good',
            verdict:{ en:'Confirmed across modalities', ja:'各モダリティで確認済み' },
            body:{ en:'All three plateau at 5-10s sequences or a single actor; memory grows linearly with frames.',
                   ja:'三件とも 5〜10秒の系列または単一人物で頭打ち。メモリはフレーム数に線形増加。' },
          },
          gap:{
            id:'g3',
            title:{ en:'Compositional 4DGS for multiple independently-moving actors',
                    ja:'独立に動く複数人物のための合成型 4DGS' },
            why:{ en:'Existing methods bake all motion into one deformation field; ego- and inter-actor motion can\'t be disentangled.',
                  ja:'既存手法は全運動を単一の変形場に焼き込み、自己運動と人物間運動を分離できない。' },
            investigation:{
              papers:[
                { id:'i3a', authors:'Zheng et al. 2025', title:'Multi-Person 4DGS' },
              ],
              analysis:{
                id:'ia4', tone:'mixed',
                verdict:{ en:'Partial coverage', ja:'部分的に対応済み' },
                body:{ en:'Zheng handles 2 actors with per-actor deformation fields but assumes manual instance masks.',
                       ja:'Zheng は人物ごとの変形場で2名を扱うが、手動のインスタンスマスクを前提とする。' },
              },
              newGap:{
                id:'g3b',
                title:{ en:'Unsupervised actor discovery + per-actor deformation in 4DGS',
                        ja:'4DGS における教師なし人物発見と人物別変形の同時学習' },
                investigation:{
                  papers:[
                    { id:'i3b', authors:'—', title:{ en:'No matching papers found', ja:'該当する論文なし' } },
                  ],
                  analysis:{
                    id:'ia5', tone:'novel',
                    verdict:{ en:'Novel direction', ja:'新規方向' },
                    body:{ en:'No prior work jointly discovers actor instances and their deformations end-to-end. Strong thesis angle.',
                           ja:'人物インスタンスとその変形を end-to-end で同時に発見する研究は存在しない。強力な博論題目。' },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },

  // ===========================================================================
  graphllm: {
    label: { en: 'Graph LLMs', ja: 'グラフ LLM' },
    query: { en: 'Large Language Models for graph-structured reasoning',
             ja: 'グラフ構造推論のための大規模言語モデル' },
    seeds: [
      { id:'p1', authors:'Wang, Feng, He, Tang, Amini, Sun', year:2023, venue:'NeurIPS',
        title:'Can Language Models Solve Graph Problems in Natural Language? (NLGraph)',
        excerpt:{ en:'GPT-4 reaches 38% on a benchmark of 8 graph reasoning tasks; chain-of-thought helps connectivity but hurts cycle detection.',
                  ja:'GPT-4 は 8 種のグラフ推論タスクで 38% を記録。CoT は連結性には有効だが閉路検出を悪化させる。' } },
      { id:'p2', authors:'Tang, Yang, Zhao, Yin, Huang, et al.', year:2024, venue:'SIGIR',
        title:'GraphGPT: Graph Instruction Tuning for Large Language Models',
        excerpt:{ en:'A two-stage graph-text alignment yields zero-shot node classification gains of 9-13 points over plain LLMs.',
                  ja:'二段階のグラフ–テキスト整合により、素の LLM 比でゼロショット節点分類が 9〜13 点向上。' } },
      { id:'p3', authors:'Chen, Mao, Liu, Liu, Wang, et al.', year:2024, venue:'arXiv',
        title:'LLaGA: Large Language and Graph Assistant',
        excerpt:{ en:'Linear neighbourhood projection plus a frozen LLM matches specialised GNNs on 4 of 5 OGB benchmarks.',
                  ja:'線形近傍射影と固定 LLM の組合せが、OGB 5 つのうち 4 つで専用 GNN と同等性能。' } },
      { id:'p4', authors:'Tang, Yang, Wei, Shi, Sun, et al.', year:2024, venue:'KDD',
        title:'HiGPT: Heterogeneous Graph Language Model',
        excerpt:{ en:'A heterogeneity-aware instruction set enables a single model to transfer across DBLP, ACM, and IMDB without per-graph fine-tuning.',
                  ja:'異種性対応の命令集合により、単一モデルが DBLP・ACM・IMDB をグラフ毎の微調整なしで横断転移。' } },
    ],
    findings: [
      {
        id:'f1', from:['p1','p2'], sourcePaper:'p1',
        title:{ en:'Plain LLMs fail on multi-hop graph reasoning even with chain-of-thought',
                ja:'素の LLM は CoT を用いても多ホップグラフ推論で破綻する' },
        excerpt:{ en:'…chain-of-thought helps connectivity but hurts cycle detection…',
                  ja:'…CoT は連結性には有効だが閉路検出を悪化させる…' },
        subSearch:{
          papers:[
            { id:'sp1a', authors:'Fatemi et al. 2024', title:'Talk Like a Graph (ICLR)' },
            { id:'sp1b', authors:'Perozzi et al. 2024', title:'GraphToken: Soft prompts for graphs' },
            { id:'sp1c', authors:'Zhang et al. 2024', title:'GraphArena: 10 graph reasoning tasks' },
          ],
          analysis:{
            id:'a1', tone:'good',
            verdict:{ en:'Confirmed (3/3)', ja:'確認済み (3/3)' },
            body:{ en:'All three confirm < 50% accuracy on 3+ hop tasks even with structured prompts; soft-prompt encodings narrow but don\'t close the gap.',
                   ja:'三件とも構造化プロンプト下でも 3 ホップ以上で 50% 未満を確認。ソフトプロンプトでは差を縮めるが解消できず。' },
          },
          gap:{
            id:'g1',
            title:{ en:'No graph-reasoning benchmark separates algorithmic from semantic graph tasks',
                    ja:'アルゴリズム的タスクと意味的タスクを分離するグラフ推論ベンチマークが存在しない' },
            why:{ en:'Existing suites mix shortest-path with citation-network QA — failure modes can\'t be attributed.',
                  ja:'既存スイートは最短路と引用網 QA を混合しており、失敗要因の帰属が不能。' },
            investigation:{
              papers:[
                { id:'i1a', authors:'Wang et al. 2024', title:'GraphInstruct: 21-task benchmark' },
                { id:'i1b', authors:'Liu et al. 2025', title:'ProGraph: programmatic graph QA' },
              ],
              analysis:{
                id:'ia1', tone:'mixed',
                verdict:{ en:'Partial coverage', ja:'部分的に対応済み' },
                body:{ en:'Both add more tasks but neither isolates algorithmic vs. semantic reasoning by construction; a controlled study is missing.',
                       ja:'いずれもタスク数を増やすのみで、アルゴリズム的・意味的推論を構造的に分離する統制研究は欠如。' },
              },
              newGap:{
                id:'g1b',
                title:{ en:'Causal benchmark isolating algorithmic-vs-semantic graph competence in LLMs',
                        ja:'LLM のアルゴリズム的・意味的グラフ能力を分離する因果ベンチマーク' },
                investigation:{
                  papers:[
                    { id:'i1c', authors:'—', title:{ en:'No matching papers found', ja:'該当する論文なし' } },
                  ],
                  analysis:{
                    id:'ia2', tone:'novel',
                    verdict:{ en:'Novel direction', ja:'新規方向' },
                    body:{ en:'No paper varies algorithmic and semantic difficulty as controlled axes. Strong, very feasible thesis target.',
                           ja:'アルゴリズム的難易度と意味的難易度を統制変数として扱った論文は皆無。実現性の高い博論題目。' },
                  },
                },
              },
            },
          },
        },
      },
      {
        id:'f2', from:['p3'], sourcePaper:'p3',
        title:{ en:'Frozen LLMs + simple graph projections match specialised GNNs',
                ja:'固定 LLM と単純なグラフ射影で専用 GNN に並ぶ性能' },
        excerpt:{ en:'…matches specialised GNNs on 4 of 5 OGB benchmarks…',
                  ja:'…OGB 5 つのうち 4 つで専用 GNN と同等性能…' },
        subSearch:{
          papers:[
            { id:'sp2a', authors:'Huang et al. 2024', title:'GraphAdapter (KDD)' },
            { id:'sp2b', authors:'Liu et al. 2024',   title:'OFA: One-For-All graph foundation' },
          ],
          analysis:{
            id:'a2', tone:'good',
            verdict:{ en:'Confirmed on text-attributed graphs', ja:'テキスト付きグラフで確認済み' },
            body:{ en:'Both adapters reach GNN-parity when node text is available; the result hinges on rich textual features.',
                   ja:'いずれのアダプタも節点テキストが豊富な場合に GNN 同等。結果はテキスト特徴の豊富さに依存。' },
          },
          gap:{
            id:'g2',
            title:{ en:'No LLM-graph method tested on text-poor scientific networks',
                    ja:'テキストの乏しい科学ネットワークで LLM-グラフ手法は未検証' },
            why:{ en:'Protein–protein and reaction networks have weak per-node text; current methods may collapse.',
                  ja:'タンパク質相互作用や反応ネットワークでは節点テキストが乏しく、現行手法は破綻しうる。' },
            investigation:{
              papers:[
                { id:'i2a', authors:'—', title:{ en:'No prior comparison found', ja:'先行する比較研究なし' } },
              ],
              analysis:{
                id:'ia3', tone:'novel',
                verdict:{ en:'Novel direction', ja:'新規方向' },
                body:{ en:'Pretraining LLMs to ingest text-poor graphs via learned structural tokenisers is unexplored.',
                       ja:'テキストの乏しいグラフを学習可能な構造トークナイザで LLM に取り込む試みは未開拓。' },
              },
            },
          },
        },
      },
      {
        id:'f3', from:['p2','p4'], sourcePaper:'p4',
        title:{ en:'Instruction tuning enables cross-domain transfer across heterogeneous graphs',
                ja:'命令調整により異種グラフ間で領域横断転移が可能になる' },
        excerpt:{ en:'…transfer across DBLP, ACM, and IMDB without per-graph fine-tuning…',
                  ja:'…DBLP・ACM・IMDB をグラフ毎の微調整なしで横断転移…' },
        subSearch:{
          papers:[
            { id:'sp3a', authors:'Wei et al. 2024', title:'InstructGLM (NAACL)' },
            { id:'sp3b', authors:'Sun et al. 2024', title:'All-in-One graph prompt' },
            { id:'sp3c', authors:'Zhao et al. 2025', title:'GraphAlign cross-domain pretraining' },
          ],
          analysis:{
            id:'a3', tone:'good',
            verdict:{ en:'Confirmed across domains', ja:'領域間で確認済み' },
            body:{ en:'Instruction-style training generalises across citation, social, and bibliographic graphs by 5–11 points zero-shot.',
                   ja:'命令型学習が引用・ソーシャル・書誌グラフ間でゼロショット 5〜11 点改善。' },
          },
          gap:{
            id:'g3',
            title:{ en:'Cross-modality transfer (graph → graph+image) unstudied',
                    ja:'モダリティ横断転移（グラフ → グラフ+画像）が未検証' },
            why:{ en:'All transfers are within graph-only domains; molecular graphs paired with crystal images are a natural test bed.',
                  ja:'転移はすべてグラフ単体間。分子グラフと結晶画像の対は自然な検証対象だが未着手。' },
            investigation:{
              papers:[
                { id:'i3a', authors:'Kim et al. 2025', title:'MoLM: molecular language model' },
              ],
              analysis:{
                id:'ia4', tone:'mixed',
                verdict:{ en:'Partial coverage', ja:'部分的に対応済み' },
                body:{ en:'Kim aligns SMILES and image but does not transfer across graph schemas (molecule → reaction network).',
                       ja:'Kim は SMILES と画像を整合させるが、グラフ構造間（分子 → 反応網）の転移は扱わず。' },
              },
              newGap:{
                id:'g3b',
                title:{ en:'Schema-agnostic graph+image transfer for materials discovery',
                        ja:'材料探索のためのスキーマ非依存なグラフ+画像転移' },
                investigation:{
                  papers:[
                    { id:'i3b', authors:'—', title:{ en:'No matching papers found', ja:'該当する論文なし' } },
                  ],
                  analysis:{
                    id:'ia5', tone:'novel',
                    verdict:{ en:'Novel direction', ja:'新規方向' },
                    body:{ en:'No work transfers across graph schemas while also conditioning on imagery. Tractable and material-science-relevant.',
                           ja:'グラフスキーマ間転移と画像条件付けを同時に行う研究は皆無。材料科学に直結する取り組み可能な題目。' },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },

  // ===========================================================================
  freud: {
    label: { en: 'What Freud Missed', ja: 'フロイトが見落としたもの' },
    query: { en: "Reassessing what Freud's framework neglected — open gaps in post-psychoanalytic theory",
             ja: 'フロイトの枠組みが見落としたもの — ポスト精神分析理論の未解決領域' },
    seeds: [
      { id:'p1', authors:'Bowlby, J.', year:1969, venue:'Hogarth Press',
        title:'Attachment and Loss, Vol. 1: Attachment',
        excerpt:{ en:'Early caregiver bonds — not intrapsychic libidinal conflict — are the primary organiser of personality across the lifespan.',
                  ja:'人格を生涯にわたって組織化する主因は、内的リビドー葛藤ではなく初期養育者との絆である。' } },
      { id:'p2', authors:'Horney, K.', year:1939, venue:'W. W. Norton',
        title:'New Ways in Psychoanalysis',
        excerpt:{ en:'Penis envy and the Oedipus complex misread female development; cultural and interpersonal pressures account for the same clinical material.',
                  ja:'ペニス羨望とエディプス・コンプレックスは女性の発達を誤読しており、同じ臨床素材は文化的・対人的圧力で説明可能。' } },
      { id:'p3', authors:'van der Kolk, B.', year:2014, venue:'Viking',
        title:'The Body Keeps the Score: Brain, Mind, and Body in the Healing of Trauma',
        excerpt:{ en:'Traumatic memory is encoded somatically and autonomically, bypassing the verbal-symbolic system Freud assumed governed repression.',
                  ja:'外傷記憶は身体的・自律神経的に符号化され、フロイトが抑圧の場と仮定した言語–象徴系を迂回する。' } },
      { id:'p4', authors:'Fonagy, P. & Target, M.', year:1997, venue:'Dev. & Psychopath.',
        title:'Attachment and reflective function: Their role in self-organization',
        excerpt:{ en:"Mentalisation capacity develops through the caregiver's mirroring of the infant — a developmental engine Freud did not theorise.",
                  ja:'メンタライゼーション能力は養育者による乳児の鏡映を通じて発達する — フロイトが理論化しなかった発達原動力。' } },
    ],
    findings: [
      {
        id:'f1', from:['p1','p4'], sourcePaper:'p1',
        title:{ en:'Caregiver attachment, not intrapsychic libido, drives personality organisation',
                ja:'人格組織化を駆動するのは内的リビドーではなく養育者との愛着' },
        excerpt:{ en:'…primary organiser of personality across the lifespan…',
                  ja:'…人格を生涯にわたって組織化する主因…' },
        subSearch:{
          papers:[
            { id:'sp1a', authors:'Main & Solomon 1990', title:'Disorganised attachment classification' },
            { id:'sp1b', authors:'Hesse & Main 2000',  title:'Frightened/frightening parenting & dissociation' },
            { id:'sp1c', authors:'Sroufe et al. 2005', title:'Minnesota longitudinal study (40-yr)' },
          ],
          analysis:{
            id:'a1', tone:'good',
            verdict:{ en:'Confirmed (3/3)', ja:'確認済み (3/3)' },
            body:{ en:'All three converge: attachment classification at 12-18 months predicts adult relational pathology better than any Oedipal-stage marker.',
                   ja:'三件とも一致：生後12〜18か月の愛着分類は、いかなるエディプス段階指標よりも成人期の関係病理を予測する。' },
          },
          gap:{
            id:'g1',
            title:{ en:'No mechanism linking pre-verbal caregiver mismatch to specific adult defence styles',
                    ja:'前言語期の養育者ミスマッチを特定の成人防衛様式に結ぶ機序が未解明' },
            why:{ en:'We can predict outcome but not why one infant develops splitting and another idealisation; intermediate steps are unobserved.',
                  ja:'結果は予測できるが、ある乳児は分裂、別の乳児は理想化を発達させる理由が不明で、中間ステップが未観察。' },
            investigation:{
              papers:[
                { id:'i1a', authors:'Beebe et al. 2010', title:'Microanalysis of mother-infant gaze' },
                { id:'i1b', authors:'Tronick & Beeghly 2011', title:'Still-face & repair sequences' },
              ],
              analysis:{
                id:'ia1', tone:'mixed',
                verdict:{ en:'Partial coverage', ja:'部分的に対応済み' },
                body:{ en:'Both capture micro-interaction in the first year, but neither links observed dyadic patterns to specific defence repertoires measured decades later.',
                       ja:'いずれも生後1年の微視的相互作用を捉えるが、観察された二者パターンを数十年後の特定の防衛機制と連結していない。' },
              },
              newGap:{
                id:'g1b',
                title:{ en:'A longitudinal study mapping specific dyadic micro-events to adult defence-style profiles',
                        ja:'特定の二者間ミクロイベントを成人期の防衛様式プロファイルに写像する縦断研究' },
                investigation:{
                  papers:[
                    { id:'i1c', authors:'—', title:{ en:'No matching study found', ja:'該当する研究なし' } },
                  ],
                  analysis:{
                    id:'ia2', tone:'novel',
                    verdict:{ en:'Novel direction', ja:'新規方向' },
                    body:{ en:'No prospective dataset combines second-by-second mother-infant coding with adult defence-style assessments. Ethically and methodologically tractable.',
                           ja:'秒単位の母子コーディングと成人期防衛様式評価を組み合わせた前向きデータは存在しない。倫理的にも方法論的にも実現可能。' },
                  },
                },
              },
            },
          },
        },
      },
      {
        id:'f2', from:['p3'], sourcePaper:'p3',
        title:{ en:'Trauma is encoded somatically, bypassing the verbal-symbolic system Freud privileged',
                ja:'外傷は身体的に符号化され、フロイトが特権化した言語–象徴系を迂回する' },
        excerpt:{ en:'…bypassing the verbal-symbolic system Freud assumed governed repression…',
                  ja:'…フロイトが抑圧の場と仮定した言語–象徴系を迂回…' },
        subSearch:{
          papers:[
            { id:'sp2a', authors:'Porges 2011',  title:'The Polyvagal Theory' },
            { id:'sp2b', authors:'Schore 2003',  title:'Affect Regulation and the Repair of the Self' },
            { id:'sp2c', authors:'Lanius et al. 2010', title:'Dissociative subtype of PTSD (fMRI)' },
          ],
          analysis:{
            id:'a2', tone:'good',
            verdict:{ en:'Confirmed across modalities', ja:'各モダリティで確認済み' },
            body:{ en:'Autonomic, neuroimaging, and clinical lines independently support body-first encoding of trauma, contradicting the repression-then-symbol model.',
                   ja:'自律神経・神経画像・臨床の各系統が独立に、抑圧→象徴モデルに反する身体先行の外傷符号化を支持。' },
          },
          gap:{
            id:'g2',
            title:{ en:'No mechanistic account of why some somatic traumas eventually become symbolisable and others do not',
                    ja:'なぜある身体的外傷は最終的に象徴化され他は象徴化されないかの機序が未解明' },
            why:{ en:'Clinical observation shows a striking split; predictors of symbolisation vs chronic somatisation are not characterised.',
                  ja:'臨床上、象徴化と慢性身体化への分岐は鮮明だが、その予測因子は未特定。' },
            investigation:{
              papers:[
                { id:'i2a', authors:'—', title:{ en:'No prospective study found', ja:'前向き研究なし' } },
              ],
              analysis:{
                id:'ia3', tone:'novel',
                verdict:{ en:'Novel direction', ja:'新規方向' },
                body:{ en:'No study tracks whether an initially somatic trauma becomes verbally narratable years later, nor what predicts that transition. Open thesis territory.',
                       ja:'当初は身体的だった外傷が数年後に言語化されるか、何がその移行を予測するかを追跡した研究は皆無。博論の沃野。' },
              },
            },
          },
        },
      },
      {
        id:'f3', from:['p2','p4'], sourcePaper:'p2',
        title:{ en:'Freudian female development is a cultural artefact, not a universal psychic structure',
                ja:'フロイト的女性発達は普遍的心的構造ではなく文化的産物' },
        excerpt:{ en:'…cultural and interpersonal pressures account for the same clinical material…',
                  ja:'…同じ臨床素材は文化的・対人的圧力で説明可能…' },
        subSearch:{
          papers:[
            { id:'sp3a', authors:'Chodorow 1978', title:'The Reproduction of Mothering' },
            { id:'sp3b', authors:'Benjamin 1988', title:'The Bonds of Love' },
            { id:'sp3c', authors:'Layton 2020',    title:'Toward a Social Psychoanalysis' },
          ],
          analysis:{
            id:'a3', tone:'good',
            verdict:{ en:'Confirmed in theory; under-tested empirically', ja:'理論的には確認、実証は不十分' },
            body:{ en:"Three independent reformulations show Freud's account dissolves once gender role and social context are entered as variables.",
                   ja:'三件の独立した再定式化が、性役割と社会的文脈を変数化するとフロイトの説明が成立しないことを示す。' },
          },
          gap:{
            id:'g3',
            title:{ en:'No cross-cultural empirical work testing whether "Oedipal" dynamics appear outside Western nuclear families',
                    ja:'西洋核家族以外で「エディプス的」動態が出現するかを検証する文化横断的実証研究の欠如' },
            why:{ en:'Theoretical critique is decades old; ethnographic-and-clinical replication across non-Western family structures is still rare.',
                  ja:'理論的批判は数十年前からあるが、非西洋家族構造での民族誌的かつ臨床的な再現研究は依然として希少。' },
            investigation:{
              papers:[
                { id:'i3a', authors:'Kakar 2008', title:'Culture and Psyche (Indian families)' },
              ],
              analysis:{
                id:'ia4', tone:'mixed',
                verdict:{ en:'Partial coverage', ja:'部分的に対応済み' },
                body:{ en:'Kakar offers rich case material from joint families but uses no comparative coding scheme; results are not aggregable.',
                       ja:'Kakar は合同家族の豊富な事例を提示するが、比較コーディング体系を欠き結果の集計が不能。' },
              },
              newGap:{
                id:'g3b',
                title:{ en:'Comparable coding scheme for Oedipal-analogue dynamics across family structures (nuclear, joint, communal, single-parent)',
                        ja:'家族構造（核・合同・共同体・ひとり親）横断で比較可能なエディプス類似動態のコーディング体系' },
                investigation:{
                  papers:[
                    { id:'i3b', authors:'—', title:{ en:'No matching framework found', ja:'該当する枠組みなし' } },
                  ],
                  analysis:{
                    id:'ia5', tone:'novel',
                    verdict:{ en:'Novel direction', ja:'新規方向' },
                    body:{ en:'No published instrument lets you score the same construct across heterogeneous family forms. Building one is a concrete, high-impact thesis.',
                           ja:'同一構成概念を異種の家族形態で採点できる公開された道具は存在しない。それを構築すること自体が具体的かつ影響力ある博論題目。' },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },

  // ===========================================================================
  mechinterp: {
    label: { en: 'Mechanistic Interpretability', ja: '機構的解釈可能性' },
    query: { en: 'Sparse autoencoders for mechanistic interpretability of transformers',
             ja: 'Transformer の機構的解釈に向けたスパースオートエンコーダ' },
    seeds: [
      { id:'p1', authors:'Bricken, Templeton, Batson, et al.', year:2023, venue:'Anthropic',
        title:'Towards Monosemanticity: Decomposing Language Models with Dictionary Learning',
        excerpt:{ en:'A sparse autoencoder trained on a 1-layer transformer recovers thousands of monosemantic, human-interpretable features.',
                  ja:'1 層 Transformer 上のスパース AE が、数千の単義かつ人間にも解釈可能な特徴を復元。' } },
      { id:'p2', authors:'Templeton, Conerly, Marcus, et al.', year:2024, venue:'Anthropic',
        title:'Scaling Monosemanticity: Extracting Features from Claude 3 Sonnet',
        excerpt:{ en:'SAEs scale to a production-grade model and reveal multilingual, multimodal features for concrete concepts.',
                  ja:'SAE が本番級モデルに拡張可能で、具体概念について多言語・多モーダルな特徴を抽出。' } },
      { id:'p3', authors:'Cunningham, Ewart, Smith, Huben, Sharkey', year:2023, venue:'arXiv',
        title:'Sparse Autoencoders Find Highly Interpretable Features in Language Models',
        excerpt:{ en:'Independent confirmation on Pythia: dictionary learning recovers features more interpretable than neurons.',
                  ja:'Pythia 上での独立確認：辞書学習がニューロンより解釈可能な特徴を復元。' } },
      { id:'p4', authors:'Marks, Rager, Michaud, et al.', year:2025, venue:'ICLR',
        title:'Sparse Feature Circuits: Discovering and Editing Interpretable Causal Graphs in LMs',
        excerpt:{ en:'Sparse-feature circuits localise specific behaviours (gender bias, induction) to <100 features each.',
                  ja:'スパース特徴回路により特定挙動（性別バイアス・誘導）がそれぞれ 100 特徴未満に局在化。' } },
    ],
    findings: [
      {
        id:'f1', from:['p1','p3'], sourcePaper:'p1',
        title:{ en:'SAEs recover monosemantic features that humans can name',
                ja:'SAE は人間が命名可能な単義特徴を復元する' },
        excerpt:{ en:'…thousands of monosemantic, human-interpretable features…',
                  ja:'…数千の単義かつ人間にも解釈可能な特徴…' },
        subSearch:{
          papers:[
            { id:'sp1a', authors:'Rajamanoharan et al. 2024', title:'Gated SAE' },
            { id:'sp1b', authors:'Gao et al. 2024',           title:'Scaling laws for SAEs (OpenAI)' },
            { id:'sp1c', authors:'Bussmann et al. 2024',     title:'BatchTopK SAE' },
          ],
          analysis:{
            id:'a1', tone:'good',
            verdict:{ en:'Confirmed (3/3)', ja:'確認済み (3/3)' },
            body:{ en:'Architectural variants all preserve monosemanticity and improve reconstruction-sparsity Pareto fronts.',
                   ja:'各派生アーキテクチャは単義性を保ちつつ、再構成-スパース性のパレートフロントを改善。' },
          },
          gap:{
            id:'g1',
            title:{ en:'No causal protocol to verify a feature is the cause of a behaviour',
                    ja:'特徴が挙動の因果原因であることを検証する手順がない' },
            why:{ en:'Feature labels are descriptive, not causal — ablation-based checks are inconsistent across papers.',
                  ja:'特徴ラベルは記述的であり因果ではなく、論文間でアブレーション検証も不揃い。' },
            investigation:{
              papers:[
                { id:'i1a', authors:'Hsu et al. 2025', title:'Causal scrubbing for SAE features' },
                { id:'i1b', authors:'O\'Neill et al. 2025', title:'Sparse feature interventions' },
              ],
              analysis:{
                id:'ia1', tone:'mixed',
                verdict:{ en:'Partial coverage', ja:'部分的に対応済み' },
                body:{ en:'Both intervene at feature level but use different ablation schemes; results are not yet comparable.',
                       ja:'両論文とも特徴レベルで介入するが、アブレーション方式が異なり結果が直接比較不能。' },
              },
              newGap:{
                id:'g1b',
                title:{ en:'A standardised causal-attribution benchmark for SAE features',
                        ja:'SAE 特徴のための標準化された因果帰属ベンチマーク' },
                investigation:{
                  papers:[
                    { id:'i1c', authors:'—', title:{ en:'No matching papers found', ja:'該当する論文なし' } },
                  ],
                  analysis:{
                    id:'ia2', tone:'novel',
                    verdict:{ en:'Novel direction', ja:'新規方向' },
                    body:{ en:'No work defines a shared causal-attribution suite for SAE features. High-impact thesis target.',
                           ja:'SAE 特徴に対する共通因果帰属スイートを定義した研究は存在しない。インパクトの高い博論題目。' },
                  },
                },
              },
            },
          },
        },
      },
      {
        id:'f2', from:['p2'], sourcePaper:'p2',
        title:{ en:'SAE features scale and span multiple modalities',
                ja:'SAE 特徴はスケーリング可能でマルチモーダルに跨る' },
        excerpt:{ en:'…multilingual, multimodal features for concrete concepts…',
                  ja:'…具体概念について多言語・多モーダルな特徴…' },
        subSearch:{
          papers:[
            { id:'sp2a', authors:'Lieberum et al. 2024', title:'Gemma Scope (DeepMind SAE suite)' },
            { id:'sp2b', authors:'He et al. 2024',       title:'Llama Scope: SAE on Llama-3' },
          ],
          analysis:{
            id:'a2', tone:'good',
            verdict:{ en:'Confirmed in 2 ecosystems', ja:'2 つの環境で確認済み' },
            body:{ en:'Both open SAE suites confirm scaling and multilingual generalisation on different model families.',
                   ja:'公開された両 SAE スイートが、異なるモデル系列でスケーリングと多言語汎化を確認。' },
          },
          gap:{
            id:'g2',
            title:{ en:'No SAE study on multimodal (vision+language) frontier models',
                    ja:'マルチモーダル（視覚＋言語）最先端モデルへの SAE 研究が存在しない' },
            why:{ en:'Open SAE suites cover text-only LMs; vision-language models like LLaVA-1.6 lack analogous tooling.',
                  ja:'公開 SAE スイートはテキスト LM のみ。LLaVA-1.6 等の VLM に対応する道具立てがない。' },
            investigation:{
              papers:[
                { id:'i2a', authors:'—', title:{ en:'No matching papers found', ja:'該当する論文なし' } },
              ],
              analysis:{
                id:'ia3', tone:'novel',
                verdict:{ en:'Novel direction', ja:'新規方向' },
                body:{ en:'Extending SAEs to multimodal residual streams is unexplored despite obvious utility.',
                       ja:'マルチモーダル残差ストリームへの SAE 拡張は明白な有用性がありつつ未開拓。' },
              },
            },
          },
        },
      },
      {
        id:'f3', from:['p4'], sourcePaper:'p4',
        title:{ en:'Sparse feature circuits localise behaviours to small subgraphs',
                ja:'スパース特徴回路は挙動を小規模な部分グラフに局在化する' },
        excerpt:{ en:'…localise specific behaviours … to <100 features each…',
                  ja:'…特定挙動を 100 特徴未満に局在化…' },
        subSearch:{
          papers:[
            { id:'sp3a', authors:'Conmy et al. 2023', title:'ACDC: automatic circuit discovery' },
            { id:'sp3b', authors:'Syed et al. 2024',  title:'Attribution Patching at scale' },
            { id:'sp3c', authors:'Olah et al. 2024',  title:'Circuits thread updates' },
          ],
          analysis:{
            id:'a3', tone:'good',
            verdict:{ en:'Confirmed across methods', ja:'各手法で確認済み' },
            body:{ en:'All three methods agree on the existence of compact circuits and the rough size of behavioural subgraphs.',
                   ja:'三手法とも、コンパクトな回路の存在と挙動部分グラフのおおよその規模で一致。' },
          },
          gap:{
            id:'g3',
            title:{ en:'Circuit-level evidence on safety-relevant behaviours (refusal, deception) is thin',
                    ja:'安全性に関わる挙動（拒否・欺瞞）の回路レベル証拠は希薄' },
            why:{ en:'Most circuits target factual or syntactic tasks; safety behaviours remain mostly behavioural studies.',
                  ja:'回路の対象は事実・統語タスクが中心で、安全性関連挙動は依然として行動レベルの研究が主流。' },
            investigation:{
              papers:[
                { id:'i3a', authors:'Marks et al. 2024', title:'Refusal circuits in Llama-3' },
              ],
              analysis:{
                id:'ia4', tone:'mixed',
                verdict:{ en:'Partial coverage', ja:'部分的に対応済み' },
                body:{ en:'Marks isolates a refusal direction but not a full circuit; deception is untouched.',
                       ja:'Marks は拒否方向を分離するが完全な回路ではなく、欺瞞は未着手。' },
              },
              newGap:{
                id:'g3b',
                title:{ en:'End-to-end circuit account of deception and sandbagging behaviours',
                        ja:'欺瞞・能力隠蔽挙動の end-to-end 回路解析' },
                investigation:{
                  papers:[
                    { id:'i3b', authors:'—', title:{ en:'No matching papers found', ja:'該当する論文なし' } },
                  ],
                  analysis:{
                    id:'ia5', tone:'novel',
                    verdict:{ en:'Novel direction', ja:'新規方向' },
                    body:{ en:'No published circuit-level account of deception exists. Safety-critical and tractable with current SAE tooling.',
                           ja:'欺瞞の回路レベル分析は未公開。現状の SAE 道具立てで取り組み可能、安全性上も重要。' },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

window.SCENES = SCENES;
window.SCENE_ORDER = ['market','gsplat','graphllm','freud'];
