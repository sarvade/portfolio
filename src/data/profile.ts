/**
 * Single source of truth for the home page.
 * Every figure here comes from the résumé (public/Sai_Sarvade_Resume.pdf).
 * Case studies and projects live in src/content/work/, blog posts in src/content/blog/.
 */

export const site = {
  name: 'Sai S Sarvade',
  role: 'Data Engineer',
  location: 'San Jose, CA',
  email: 'sai.s.sarvade@gmail.com',
  description:
    'Sai S Sarvade is a data engineer at TikTok who turns raw event logs into canonical datasets and metrics people can trust: 30+ production pipelines, 20 TB+ a day.',
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
    "I’m Sai Sarvade, a data engineer at TikTok. I own 30+ production pipelines processing 20 TB+ a day, and the metric definitions 15M+ users act on. Before that, I spent nearly four years building data pipelines at Delta\u00a0Air\u00a0Lines.",
};

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
  caption:
    'The shape of the pipelines I run at TikTok, simplified. The moving dots are illustrative; the numbers are real.',
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
    context:
      'Creator Compass and Seller Compass, the self-serve analytics products 15M+ users rely on across 19 countries.',
    highlights: [
      {
        text: 'Define and manage the multi-step ETL that turns raw event logs into the canonical datasets the company reports on. Shipped 18 new metric definitions with 12 months of rebuilt history, and own the documentation so teams read the same number the same way across 19 markets.',
        work: 'canonical-metrics',
      },
      {
        text: 'Set the data integrity standards and delivery SLAs for 30+ production pipelines at 20 TB a day, and built PulseOps to enforce them: automated validation across every job, freshness and quality checks, and alerting before a stakeholder opens a stale dashboard. Wrote the standards doc the team adopted and deployed it across 5 regions.',
        work: 'pulseops',
      },
      {
        text: 'Caught a revenue calculation error during validation that would have published wrong numbers to every user dashboard at launch, on a rebuild already committed to a date. Shipped on time and correct rather than choosing between them.',
      },
      {
        text: 'Diagnosed a stalled ranking feature others were fixing by tuning the query, found the constraint was the access pattern, and moved computation upstream into Flink over a 1.5B+ record stream, cutting query time and compute cost by orders of magnitude.',
        work: 'flink-upstream',
      },
      {
        text: 'Build foundational data products and reporting that let analysts and business teams self-serve rather than queue behind a data engineer, and translate ambiguous stakeholder questions into the data models and technical requirements that answer them.',
      },
      {
        text: 'Support machine learning work end to end, building the feature and evaluation datasets a production model consumed and the serving layer around its deployment. Mentor junior engineers on modeling and code review.',
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
        text: 'Modeled the loyalty domain into Teradata for 500K+ customers and built the segmentation reporting and dashboards marketing and operations teams ran campaigns from, working directly with non-technical stakeholders as requirements shifted.',
      },
      {
        text: 'Led migration of 50+ legacy Informatica workflows onto AWS Glue PySpark and Lambda with GitHub-based CI/CD, cutting licensing costs 65%, roughly $850K a year.',
        work: 'informatica-to-glue',
      },
      {
        text: 'Designed and operated production Airflow pipelines integrating vendor APIs and legacy systems into S3 and Teradata, cutting ETL runtime 65% from 4.5 hours to 1.5 and holding 99.9% accuracy with idempotent DAGs and reconciliation checks.',
        work: 'airflow-pipelines',
      },
      {
        text: 'Built asynchronous event-driven ingestion on Kinesis, Lambda, and SNS carrying 3M+ daily transactions at 99.9% uptime, cutting end-to-end latency from 2 hours to under 5 minutes.',
        work: 'event-driven-ingestion',
      },
      {
        text: 'Built a serverless S3 data lake, moving 15 TB with AWS DMS and cataloging it through Glue Catalog and Lake Formation with the access controls required for GDPR and CCPA.',
      },
    ],
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
      { name: 'Data SLAs', work: 'pulseops' },
      { name: 'Automated validation', work: 'pulseops' },
      { name: 'Freshness monitoring', work: 'pulseops' },
      { name: 'Alerting', work: 'pulseops' },
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
