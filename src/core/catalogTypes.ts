export interface CatalogSearchResponse {
  ok: boolean;
  data: CatalogEntry[];
  last_updated: string;
}

export interface CatalogEntry {
  id: number;
  url: string;
  name: string;
  owner: string;
  full_name: string;
  repo: Repo;
  release: Release;
  tarbar_url: string;
  zipball_url: string;
  git_trees_url: string;
  contents_url: string;
  language: string;
  language_title: string;
  language_direction: string;
  language_is_gl: boolean;
  subject: string;
  flavor_type: string;
  flavor: string;
  abbreviation: string;
  title: string;
  branch_or_tag_name: string;
  ref_type: string;
  commit_sha: string;
  stage: string;
  metadata_url: string;
  metadata_json_url: string;
  metadata_api_contents_url: string;
  metadata_type: string;
  metadata_version: string;
  content_format: string;
  released: string;
  ingredients: Ingredient[];
  books: string[];
  is_valid: boolean;
  validation_errors_url: string;
}

export interface Repo {
  id: number;
  owner: Owner;
  name: string;
  full_name: string;
  description: string;
  empty: boolean;
  private: boolean;
  fork: boolean;
  template: boolean;
  parent: Parent;
  mirror: boolean;
  size: number;
  languages_url: string;
  html_url: string;
  url: string;
  link: string;
  ssh_url: string;
  clone_url: string;
  original_url: string;
  website: string;
  stars_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  open_pr_counter: number;
  release_counter: number;
  default_branch: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string;
  permissions: Permissions;
  has_issues: boolean;
  internal_tracker: InternalTracker;
  has_wiki: boolean;
  has_pull_requests: boolean;
  has_projects: boolean;
  projects_mode: string;
  has_releases: boolean;
  has_packages: boolean;
  has_actions: boolean;
  ignore_whitespace_conflicts: boolean;
  allow_merge_commits: boolean;
  allow_rebase: boolean;
  allow_rebase_explicit: boolean;
  allow_squash_merge: boolean;
  allow_fast_forward_only_merge: boolean;
  allow_rebase_update: boolean;
  default_delete_branch_after_merge: boolean;
  default_merge_style: string;
  default_allow_maintainer_edit: boolean;
  avatar_url: string;
  internal: boolean;
  mirror_interval: string;
  object_format_name: string;
  mirror_updated: string;
  repo_transfer: any;
  topics: any;
  licenses: any;
  metadata_type: string;
  metadata_version: string;
  language: string;
  language_title: string;
  language_direction: string;
  language_is_gl: boolean;
  subject: string;
  flavor_type: string;
  flavor: string;
  abbreviation: string;
  title: string;
  ingredients: Ingredient[];
  checking_level: number;
  catalog: Catalog;
  content_format: string;
  healthcheck_severity: string;
  healthcheck_url: string;
}

export interface Owner {
  id: number;
  login: string;
  login_name: string;
  source_id: number;
  full_name: string;
  email: string;
  avatar_url: string;
  html_url: string;
  language: string;
  is_admin: boolean;
  last_login: string;
  created: string;
  repo_languages: string[];
  repo_subjects: string[];
  repo_metadata_types: string[];
  restricted: boolean;
  active: boolean;
  prohibit_login: boolean;
  location: string;
  website: string;
  description: string;
  visibility: string;
  followers_count: number;
  following_count: number;
  starred_repos_count: number;
  username: string;
}

export interface Parent {
  id: number;
  owner: Owner;
  name: string;
  full_name: string;
  description: string;
  empty: boolean;
  private: boolean;
  fork: boolean;
  template: boolean;
  parent: any;
  mirror: boolean;
  size: number;
  languages_url: string;
  html_url: string;
  url: string;
  link: string;
  ssh_url: string;
  clone_url: string;
  original_url: string;
  website: string;
  stars_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  open_pr_counter: number;
  release_counter: number;
  default_branch: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string;
  permissions: Permissions;
  has_issues: boolean;
  internal_tracker: InternalTracker;
  has_wiki: boolean;
  has_pull_requests: boolean;
  has_projects: boolean;
  projects_mode: string;
  has_releases: boolean;
  has_packages: boolean;
  has_actions: boolean;
  ignore_whitespace_conflicts: boolean;
  allow_merge_commits: boolean;
  allow_rebase: boolean;
  allow_rebase_explicit: boolean;
  allow_squash_merge: boolean;
  allow_fast_forward_only_merge: boolean;
  allow_rebase_update: boolean;
  default_delete_branch_after_merge: boolean;
  default_merge_style: string;
  default_allow_maintainer_edit: boolean;
  avatar_url: string;
  internal: boolean;
  mirror_interval: string;
  object_format_name: string;
  mirror_updated: string;
  repo_transfer: any;
  topics: any;
  licenses: any;
  metadata_type: string;
  metadata_version: string;
  language: string;
  language_title: string;
  language_direction: string;
  language_is_gl: boolean;
  subject: string;
  flavor_type: string;
  flavor: string;
  abbreviation: string;
  title: string;
  ingredients: Ingredient[];
  checking_level: number;
  catalog: Catalog;
  content_format: string;
  healthcheck_severity: string;
  healthcheck_url: string;
}

export interface Permissions {
  admin: boolean;
  push: boolean;
  pull: boolean;
}

export interface InternalTracker {
  enable_time_tracker: boolean;
  allow_only_contributors_to_track_time: boolean;
  enable_issue_dependencies: boolean;
}

export interface Ingredient {
  categories: any;
  identifier: string;
  path: string;
  sort: number;
  title: string;
  versification: string;
  exists: boolean;
  is_dir: boolean;
  size: number;
}

export interface Catalog {
  prod: any;
  preprod: any;
  latest: Latest;
}

export interface Latest {
  branch_or_tag_name: string;
  release_url: any;
  commit_sha: string;
  released: string;
  zipball_url: string;
  tarball_url: string;
  git_trees_url: string;
  contents_url: string;
}

export interface Prod {
  branch_or_tag_name: string;
  release_url: string;
  commit_sha: string;
  released: string;
  zipball_url: string;
  tarball_url: string;
  git_trees_url: string;
  contents_url: string;
}

export interface Release {
  id: number;
  tag_name: string;
  target_commitish: string;
  name: string;
  body: string;
  url: string;
  html_url: string;
  tarball_url: string;
  zipball_url: string;
  upload_url: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  author: Author;
  assets: Asset[];
  door43_metadata: Door43Metadata;
}

export interface Author {
  id: number;
  login: string;
  login_name: string;
  source_id: number;
  full_name: string;
  email: string;
  avatar_url: string;
  html_url: string;
  language: string;
  is_admin: boolean;
  last_login: string;
  created: string;
  repo_languages: string[];
  repo_subjects: string[];
  repo_metadata_types: string[];
  restricted: boolean;
  active: boolean;
  prohibit_login: boolean;
  location: string;
  website: string;
  description: string;
  visibility: string;
  followers_count: number;
  following_count: number;
  starred_repos_count: number;
  username: string;
}

export interface Asset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  created_at: string;
  uuid: string;
  browser_download_url: string;
}

export interface Door43Metadata {
  id: number;
  url: string;
  name: string;
  owner: string;
  full_name: string;
  tarbar_url: string;
  zipball_url: string;
  git_trees_url: string;
  contents_url: string;
  language: string;
  language_title: string;
  language_direction: string;
  language_is_gl: boolean;
  subject: string;
  flavor_type: string;
  flavor: string;
  abbreviation: string;
  title: string;
  branch_or_tag_name: string;
  ref_type: string;
  commit_sha: string;
  stage: string;
  metadata_url: string;
  metadata_json_url: string;
  metadata_api_contents_url: string;
  metadata_type: string;
  metadata_version: string;
  content_format: string;
  released: string;
  ingredients: Ingredient[];
  books: string[];
  is_valid: boolean;
  validation_errors_url: string;
}
