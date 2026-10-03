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
  headline: 'I turn raw logs into numbers people can trust.',
  intro:
    'I’m Sai Sarvade, a data engineer at TikTok. I build the pipelines, canonical datasets, and metric definitions behind analytics products used by 15M+ people. Before that, I spent nearly four years building data pipelines at Delta Air Lines.',
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
  checks: { label: 'Validation', note: 'Freshness and quality' },
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
        text: 'Own the multi-step ETL that turns raw event logs into the canonical datasets the company reports on. Shipped 18 new metric definitions with 12 months of rebuilt history, documented so every market reads them the same way.',
        work: 'canonical-metrics',
      },
      {
        text: 'Set data integrity standards and delivery SLAs at 20 TB a day, then built the tooling that enforces them: automated validation on every job, freshness and quality checks, and alerts before a stakeholder opens a stale dashboard. The team adopted the standard, and I deployed it across 5 regions.',
        work: 'data-integrity',
      },
      {
        text: 'Caught a revenue calculation error during validation that would have reached every user dashboard at launch, and still shipped on the committed date.',
      },
      {
        text: 'Diagnosed a stalled ranking feature: the constraint was the access pattern, not the query. Moved the computation upstream into Flink over a 1.5B+ record stream, cutting query time and compute cost by orders of magnitude.',
        work: 'flink-upstream',
      },
      {
        text: 'Build self-serve data products so analysts and business teams don’t queue behind a data engineer, and turn ambiguous questions into data models and technical requirements.',
      },
      {
        text: 'Built the feature and evaluation datasets and the serving layer for a production ML model. Mentor junior engineers on modeling and code review.',
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
        text: 'Led the migration of 50+ Informatica workflows to AWS Glue (PySpark) and Lambda with GitHub-based CI/CD, cutting licensing costs 65%, about $850K a year.',
        work: 'informatica-to-glue',
      },
      {
        text: 'Built event-driven ingestion on Kinesis, Lambda, and SNS for 3M+ transactions a day at 99.9% uptime, cutting end-to-end latency from 2 hours to under 5 minutes.',
        work: 'event-driven-ingestion',
      },
      {
        text: 'Designed and ran production Airflow pipelines from vendor APIs and legacy systems into S3 and Teradata, cutting ETL runtime from 4.5 hours to 1.5 at 99.9% accuracy with idempotent DAGs and reconciliation checks.',
        work: 'airflow-pipelines',
      },
      {
        text: 'Modeled the loyalty domain in Teradata for 500K+ customers and built the segmentation reporting and dashboards that marketing and operations ran campaigns from.',
      },
      {
        text: 'Built a serverless S3 data lake: moved 15 TB with AWS DMS and cataloged it in Glue Catalog and Lake Formation with the access controls GDPR and CCPA require.',
      },
    ],
  },
];

export type Principle = {
  title: string;
  body: string;
  /** Case study that shows this in practice. */
  proof: string;
  lang: 'sql' | 'yaml' | 'python';
  /** Illustrative pattern only. Never paste production code or internal names here. */
  code: string;
};

/** The "Approach" section: habits backed by work on the résumé, each with a small illustrative pattern. */
export const principles: Principle[] = [
  {
    title: 'Validate before anyone sees it',
    body: 'Freshness and quality checks run on every job, and a failure raises an alert before a stakeholder opens the dashboard. Validation is also how I caught a revenue calculation error before a launch, and the launch still shipped on time.',
    proof: 'data-integrity',
    lang: 'sql',
    code: `-- Gate the publish: any row returned = fail
select count(*) as row_count,
       count_if(revenue < 0) as negative_revenue,
       max(event_ts) as latest_event
from   staging.daily_orders
where  dt = '{{ ds }}'
having count(*) = 0
    or count_if(revenue < 0) > 0
    or max(event_ts) < date '{{ ds }}';`,
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
    title: 'Fix the access pattern, not just the query',
    body: 'When data is read the wrong way, query tuning hits a ceiling. Moving a ranking feature’s computation upstream into Flink, so the work happens as events arrive, cut query time and compute cost by orders of magnitude.',
    proof: 'flink-upstream',
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
group by item_id, window_end;`,
  },
  {
    title: 'One definition per metric',
    body: 'A metric should mean one thing everywhere. I shipped 18 new definitions with documentation and 12 months of rebuilt history, so teams in 19 markets read the same number the same way.',
    proof: 'canonical-metrics',
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
];

export type Skill = {
  name: string;
  /** Slug of a case study where the résumé shows this skill in use. */
  work?: string;
};

export type SkillGroup = { group: string; items: Skill[] };

/** Same six groups as the résumé. Only link a skill to a case study the résumé ties it to. */
export const skills: SkillGroup[] = [
  {
    group: 'Languages',
    items: [
      { name: 'Python (pandas, PySpark)', work: 'informatica-to-glue' },
      { name: 'SQL' },
      { name: 'Scala' },
      { name: 'Bash' },
    ],
  },
  {
    group: 'Transformation and modeling',
    items: [
      { name: 'dbt' },
      { name: 'Multi-step ETL', work: 'canonical-metrics' },
      { name: 'Canonical datasets', work: 'canonical-metrics' },
      { name: 'Dimensional modeling' },
      { name: 'Semantic and metrics layers' },
      { name: 'Schema design' },
    ],
  },
  {
    group: 'Pipelines and orchestration',
    items: [
      { name: 'Airflow', work: 'airflow-pipelines' },
      { name: 'Spark' },
      { name: 'Flink', work: 'flink-upstream' },
      { name: 'Kafka' },
      { name: 'Kinesis', work: 'event-driven-ingestion' },
      { name: 'Hive' },
      { name: 'Trino/Presto' },
      { name: 'GitHub version control' },
      { name: 'CI/CD', work: 'informatica-to-glue' },
    ],
  },
  {
    group: 'Warehouse and storage',
    items: [
      { name: 'Snowflake' },
      { name: 'BigQuery' },
      { name: 'Apache Iceberg on S3' },
      { name: 'ClickHouse' },
      { name: 'Teradata', work: 'airflow-pipelines' },
      { name: 'PostgreSQL' },
      { name: 'MySQL' },
    ],
  },
  {
    group: 'Reporting and self-serve',
    items: [
      { name: 'Hex' },
      { name: 'Tableau' },
      { name: 'Power BI' },
      { name: 'Streamlit' },
      { name: 'Dashboards' },
      { name: 'Metric definitions', work: 'canonical-metrics' },
      { name: 'Self-serve data products' },
    ],
  },
  {
    group: 'Integrity and reliability',
    items: [
      { name: 'Data SLAs', work: 'data-integrity' },
      { name: 'Automated validation', work: 'data-integrity' },
      { name: 'Freshness monitoring', work: 'data-integrity' },
      { name: 'Alerting', work: 'data-integrity' },
      { name: 'Reconciliation', work: 'airflow-pipelines' },
      { name: 'Lineage' },
      { name: 'Documentation', work: 'canonical-metrics' },
    ],
  },
];

export const about = {
  paragraphs: [
    'Most of my work is making sure the numbers are right: the canonical datasets a company reports on, the metric definitions people decide with, and the checks that keep both correct. I partner with product, analytics, and research teams to define metrics, set data standards, and build self-serve data products.',
    'I built the data integrity tooling my team now runs on without being asked, because waiting for permission would have meant shipping wrong numbers for another quarter.',
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
