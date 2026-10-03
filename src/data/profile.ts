/**
 * Single source of truth for the home page.
 * Figures come from the résumé. Internal product and tool names are left out on purpose.
 * Case studies and projects live in src/content/work/, blog posts in src/content/blog/.
 */

export const site = {
  name: 'Sai S Sarvade',
  role: 'Data Engineer',
  location: 'San Jose, CA',
  email: 'sai.s.sarvade@gmail.com',
  description:
    'Sai S Sarvade is a data engineer who turns raw event logs into canonical datasets and metrics people can trust. 5+ years across TikTok and Delta Air Lines.',
  /** File name inside /public. Replace the PDF to update the résumé everywhere. */
  resume: 'Sai_Sarvade_Resume.pdf',
  links: {
    linkedin: 'https://www.linkedin.com/in/saisarvade',
    github: 'https://github.com/sarvade',
    source: 'https://github.com/sarvade/portfolio',
  },
};

export const hero = {
  /** Rendered as two lines in the hero: the part before the first period, then the rest. */
  headline: 'Raw logs in. Trusted numbers out.',
  /** Typed one after another after "Hi, I’m Sai Sarvade,". Keep each short (under 26 characters). */
  roles: [
    'a data engineer',
    'an analytics engineer',
    'a big data engineer',
    'an AI builder',
    'an ETL developer',
    'a streaming engineer',
    'a data quality advocate',
    'a coder',
    'a creator',
  ],
  intro:
    'Data engineer at TikTok. I build the pipelines, canonical datasets, and metric definitions behind analytics products used by 15M+ people. Before that, I spent nearly four years building data pipelines at Delta Air Lines.',
  /**
   * Optional line shown in the at-a-glance card, e.g. 'Open to senior data engineering roles'.
   * Leave empty to hide it.
   */
  availability: '',
};

/** The at-a-glance card next to the headline. Written for a 10-second scan. */
export const glance = [
  { label: 'Role', value: 'Data Engineer at TikTok' },
  { label: 'Experience', value: '5+ years (TikTok, Delta Air Lines)' },
  { label: 'Based in', value: 'San Jose, CA' },
  { label: 'Focus', value: 'Data integrity, metric definitions, batch and streaming pipelines' },
  { label: 'Core stack', value: 'SQL, Python, Spark, Flink, Airflow, dbt, Kafka, AWS' },
  { label: 'Education', value: 'MS, Rice University' },
];

/** Labels and notes for the pipeline diagram in the hero. Keep notes short (about 22 characters). */
export const pipeline = {
  source: { label: 'Raw event logs', note: '20 TB+ a day' },
  checks: { label: 'Validation', note: 'Row-level diffs' },
  canonical: { label: 'Canonical datasets', note: 'Multi-step ETL' },
  metrics: { label: 'Metric definitions', note: '18 new, 12 months rebuilt' },
  outputs: ['Dashboards', 'Self-serve analysis', 'ML features'],
  outputsShort: ['Dashboards', 'Self-serve', 'ML features'],
  reach: '15M+ users, 19 countries',
  alert: 'Alert raised',
  caption: 'How my pipelines fit together, simplified. The moving dots are illustrative; the numbers are real.',
};

export type Highlight = {
  text: string;
  /** Slug of a case study in src/content/work/ that tells the longer story. */
  work?: string;
};

export type Job = {
  id: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  context?: string;
  highlights: Highlight[];
};

export const experience: Job[] = [
  {
    id: 'tiktok',
    company: 'TikTok',
    role: 'Data Engineer',
    location: 'San Jose, CA',
    start: 'May 2025',
    end: 'Present',
    context: 'Self-serve analytics products used by 15M+ people across 19 countries.',
    highlights: [
      {
        text: 'Took on three times my assigned scope in a three-region revenue-attribution migration: three core tables and the logic they share, two drifting regional codebases merged into one, 18 new metrics and 126 metric bindings with 12 months of rebuilt history per region, and three correctness bugs fixed before launch.',
        work: 'attribution-migration',
      },
      {
        text: 'Own the multi-step ETL from raw event logs to the canonical datasets the company reports on, at 20 TB a day, and set the data integrity standards and delivery SLAs the team adopted.',
      },
      {
        text: 'Took a creator-facing API from ~70% success at peak back to healthy by getting the OLAP engine to use an index it had silently stopped using: 40–80× fewer rows scanned per call, and only then a rate limit raised from 150 to 200 QPS.',
        work: 'olap-api-cost',
      },
      {
        text: 'Diagnosed a stalled ranking feature others were fixing by tuning the query. Moved the computation upstream into Flink over a 1.5B+ record stream, cutting query time and compute cost by orders of magnitude.',
        work: 'realtime-rankings',
      },
      {
        text: 'Restored a creator-facing feature the same day during a P1, then traced two disagreeing APIs to one false assumption. My validation caught 67,565 corrupted rows in my own first fix before it shipped, and the design we chose serves both from one table, so once it rolls out they can’t drift.',
        work: 'fix-at-the-source',
      },
      {
        text: 'Disproved a “filter bug” escalation layer by layer, then isolated a real ~8% realtime tagging gap (19 of 236 items) to a single job while proving the offline table right on all 236.',
        work: 'realtime-dq-gap',
      },
      {
        text: 'Moved regulated data across a data-residency boundary with zero compliance findings, replaced ad-hoc analyst requests with a self-serve dataset, and cut investigation turnaround from about 3 days to 1 hour.',
        work: 'cross-border-transfer',
      },
      {
        text: 'Built the A/B measurement layer for a new multimodal AI model in my first two months, and the feature and evaluation datasets a production model consumed. Encoded on-call know-how into three reusable AI assistant skills, and walk teammates through query plans and debugging patterns.',
        work: 'experiment-data-layer',
      },
    ],
  },
  {
    id: 'delta',
    company: 'Delta Air Lines',
    role: 'Data Engineer',
    location: 'Atlanta, GA',
    start: 'Aug 2021',
    end: 'May 2025',
    highlights: [
      {
        text: 'Architected the elite loyalty platform on AWS (Spark and Hive over Iceberg on S3) and moved batch jobs to streaming across 750+ flights a day: 1.6M+ elite travelers see miles within minutes of landing instead of the next morning, with 45% better query performance. Owned its encryption, IAM and CI/CD.',
        work: 'loyalty-platform',
      },
      {
        text: 'Led the migration of 50+ Informatica workflows to AWS Glue (PySpark) and Lambda with GitHub-based CI/CD, cutting licensing costs 65%, about $850K a year.',
        work: 'informatica-to-glue',
      },
      {
        text: 'Built event-driven ingestion on Kinesis, Lambda, and SNS for 3M+ transactions a day at 99.9% uptime, cutting end-to-end latency from 2 hours to under 5 minutes (more than 24× faster).',
        work: 'event-driven-ingestion',
      },
      {
        text: 'Designed and ran production Airflow pipelines from vendor APIs and legacy systems into S3 and Teradata, making ETL 3× faster (4.5 hours to 1.5) at 99.9% accuracy with idempotent DAGs and reconciliation checks.',
        work: 'airflow-pipelines',
      },
      {
        text: 'Modeled the loyalty domain in Teradata and built the segmentation reporting and dashboards, covering 500K+ customers, that marketing and operations ran campaigns from.',
      },
      {
        text: 'Built a serverless S3 data lake: moved 15 TB with AWS DMS and cataloged it in Glue Catalog and Lake Formation with the access controls GDPR and CCPA require.',
        work: 's3-data-lake',
      },
    ],
  },
];

/**
 * "Scale I work at": context, shown as a compact row under the hero.
 * Every figure comes from the résumé or interview notes; ~7 PB a year is 20 TB a day × 365.
 */
export const scale = [
  { value: '15M+', count: 15, suffix: 'M+', label: 'creators and sellers on the analytics products my data feeds' },
  { value: '19', count: 19, label: 'countries on one global e‑commerce platform' },
  { value: '4', count: 4, label: 'data regions, each with its own compliance rules' },
  { value: '~7 PB', count: 7, prefix: '~', suffix: ' PB', label: 'a year through pipelines I own (20 TB+ every day)' },
  { value: '1.5B+', count: 1.5, suffix: 'B+', label: 'events in one live-commerce stream my Flink jobs aggregated' },
  { value: '46M+', count: 46, suffix: 'M+', label: 'rows in a single daily partition of one table' },
];

/** Results: outcomes, each backed by a case study. `count` animates on first view (optional). */
export const impact = [
  { value: '40–80×', label: 'fewer rows scanned per API call after an OLAP query fix' },
  { value: '36', count: 36, label: 'region-months of revenue history rebuilt, behind row-level diffs in every region' },
  { value: '0', label: 'compliance findings moving regulated data across a residency boundary' },
  { value: '>24×', label: 'faster ingestion: 2 hours to under 5 minutes for 3M+ transactions a day' },
  { value: '1.6M+', count: 1.6, prefix: '', suffix: 'M+', label: 'elite travelers see miles within minutes on a platform I architected' },
  { value: '~$850K', count: 850, prefix: '~$', suffix: 'K', label: 'a year saved by cutting legacy ETL licensing 65%' },
];

export type Principle = {
  title: string;
  body: string;
  /** Case study that shows this in practice (optional). */
  proof?: string;
  lang?: 'sql' | 'yaml' | 'python';
  /** Illustrative pattern only. Never paste production code or internal names here. */
  code?: string;
};

/** The "Approach" section: habits backed by real work, some with a small illustrative pattern. */
export const principles: Principle[] = [
  {
    title: 'Validate before anyone sees it',
    body: 'Totals can match while rows are wrong. I diff old and new outputs row by row, per region, before anything ships. Before one launch, that habit let me trace a QA-flagged revenue discrepancy to a single misscoped filter and catch a join fan-out and a wrong-grain count; later it caught 67,565 bad rows in my own first fix.',
    proof: 'attribution-migration',
    lang: 'sql',
    code: `-- Row-level diff: every key lands in exactly one bucket
select case
         when o.id is null then 'only_in_new'
         when n.id is null then 'only_in_old'
         when abs(o.revenue - n.revenue) > 0.005
           or (o.revenue is null) <> (n.revenue is null)
           then 'value_changed'
         else 'match'
       end      as bucket,
       count(*) as rows
from      old_metrics o
full join new_metrics n on o.id = n.id
group by 1;`,
  },
  {
    title: 'Make every rerun safe',
    body: 'Retries and backfills will happen. A load that overwrites its partition gives the same result no matter how many times it runs. Idempotent DAGs and reconciliation checks are how my Airflow pipelines held 99.9% accuracy.',
    proof: 'airflow-pipelines',
    lang: 'sql',
    code: `-- Rerun a day: replaced, never duplicated
insert overwrite table mart.daily_orders
partition (dt = '{{ ds }}')
select order_id,
       customer_id,
       amount_usd
from   staging.orders
where  dt = '{{ ds }}';`,
  },
  {
    title: 'Fix cost before buying capacity',
    body: 'When an API is failing, raising its limit is the reflex. I read the query plan first. The engine had silently stopped using an index, so every call scanned 8.24M rows; a one-line hint put the index back to work, cut that 40–80×, and only then did the limit go up.',
    proof: 'olap-api-cost',
  },
  {
    title: 'Fix the access pattern, not just the query',
    body: 'When data is read the wrong way, query tuning hits a ceiling. Moving a ranking feature’s computation upstream into Flink, so the work happens as events arrive, cut query time and compute cost by orders of magnitude.',
    proof: 'realtime-rankings',
    lang: 'sql',
    code: `-- Flink SQL: aggregate as events arrive
insert into item_scores
select item_id,
       window_end,
       count(*) as interactions
from table(
  tumble(table events,
         descriptor(event_time),
         interval '5' minutes))
group by item_id, window_start, window_end;`,
  },
  {
    title: 'One definition per metric',
    body: 'A metric should mean one thing everywhere. So no metric could be computed two ways by region, I merged the regional pipelines into one codebase and shipped 18 definitions with documentation and 12 months of rebuilt history.',
    proof: 'attribution-migration',
    lang: 'yaml',
    code: `# One definition, reused everywhere
metrics:
  - name: daily_active_users
    label: Daily active users
    description: >
      Distinct users with at least
      one session in the UTC day.
    type: simple
    type_params:
      measure: active_user_count`,
  },
  {
    title: 'Return a decision, not a question',
    body: 'Ambiguous asks tend to turn into a month of “looking into it.” I split them into what is actually tractable and what is blocked, and why, then answer with a recommendation. One request split cleanly into a part that was tractable and a part policy ruled out, and the PM re-scoped the same day. The same habit avoided two builds nobody needed.',
  },
  {
    title: 'Say what the data can’t answer',
    body: 'When another team needed numbers for an investigation, I scoped what my tables could honestly support before quoting anything, delivered aggregates instead of individual records, flagged that their own figure used a different denominator, and pointed out broken arithmetic in an AI-generated summary they had been handed. Wrong numbers point an investigation the wrong way.',
  },
];

export type Skill = {
  name: string;
  /** Slug of a case study that shows this skill in use. */
  work?: string;
};

export type SkillGroup = { group: string; short: string; items: Skill[] };

/**
 * Skill groups (filters) and skills: the core set, kept short on purpose.
 * Only link a skill to a case study that shows it.
 */
export const skills: SkillGroup[] = [
  {
    group: 'Languages',
    short: 'Languages',
    items: [
      { name: 'SQL', work: 'realtime-dq-gap' },
      { name: 'Python (PySpark)', work: 'informatica-to-glue' },
    ],
  },
  {
    group: 'Batch and streaming',
    short: 'Batch and streaming',
    items: [
      { name: 'Apache Spark', work: 'loyalty-platform' },
      { name: 'Apache Flink', work: 'realtime-rankings' },
      { name: 'Apache Kafka', work: 'loyalty-platform' },
      { name: 'Apache Airflow', work: 'airflow-pipelines' },
      { name: 'Apache Hive', work: 'loyalty-platform' },
      { name: 'Amazon Kinesis', work: 'event-driven-ingestion' },
    ],
  },
  {
    group: 'Storage and OLAP',
    short: 'Storage and OLAP',
    items: [
      { name: 'Apache Iceberg on S3', work: 'loyalty-platform' },
      { name: 'Apache Doris', work: 'olap-api-cost' },
      { name: 'ClickHouse', work: 'loyalty-platform' },
      { name: 'Teradata', work: 'airflow-pipelines' },
    ],
  },
  {
    group: 'AWS',
    short: 'AWS',
    items: [
      { name: 'AWS Glue', work: 'informatica-to-glue' },
      { name: 'AWS Lambda', work: 'event-driven-ingestion' },
      { name: 'Lake Formation and DMS', work: 's3-data-lake' },
      { name: 'IAM and encryption', work: 'loyalty-platform' },
    ],
  },
  {
    group: 'Modeling and metrics',
    short: 'Modeling',
    items: [
      { name: 'dbt' },
      { name: 'Dimensional modeling' },
      { name: 'Canonical datasets', work: 'attribution-migration' },
      { name: 'Metric definitions', work: 'attribution-migration' },
    ],
  },
  {
    group: 'Data quality and reliability',
    short: 'Data quality',
    items: [
      { name: 'Row-level validation', work: 'attribution-migration' },
      { name: 'Idempotent pipelines and backfills', work: 'airflow-pipelines' },
      { name: 'Realtime vs offline reconciliation', work: 'realtime-dq-gap' },
      { name: 'Root cause analysis', work: 'fix-at-the-source' },
      { name: 'Query plans and indexing', work: 'olap-api-cost' },
      { name: 'Data residency and compliance', work: 'cross-border-transfer' },
    ],
  },
  {
    group: 'AI and ML',
    short: 'AI and ML',
    items: [
      { name: 'A/B measurement for ML models', work: 'experiment-data-layer' },
      { name: 'LLM tooling', work: 'ai-oncall-skills' },
    ],
  },
];

/** One quiet line under the skills: tools used, but not the core of the work. */
export const alsoUsed = ['Scala', 'Trino', 'Snowflake', 'BigQuery', 'PostgreSQL', 'Tableau', 'Power BI'];

export const about = {
  paragraphs: [
    'Most of my work is making sure the numbers are right: the canonical datasets a company reports on, the metric definitions people decide with, and the checks that keep both correct. I partner with product, analytics, and research teams to define metrics, set data standards, and build self-serve data products.',
    'The thing I’m known for is finding the bugs where the query runs fine and the meaning is wrong.',
    'I came to data engineering from aerospace engineering. My graduate work at Rice was exploratory analysis and anomaly detection on large scientific datasets in Python.',
  ],
};

export const education = [
  {
    school: 'Rice University',
    degree: 'MS, Space Engineering',
    detail: 'Concentration in Data Science',
    place: 'Houston, TX',
    years: '2019 to 2021',
  },
  {
    school: 'Amrita Vishwa Vidyapeetham',
    degree: 'BE, Aerospace Engineering',
    place: 'Coimbatore, India',
    years: '2015 to 2019',
  },
];
