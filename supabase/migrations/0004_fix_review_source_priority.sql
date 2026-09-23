-- Fixes a data bug: the review_source row in seed.sql originally listed
-- Review Index before Through Widget, with an explainer describing Index
-- as the default -- backwards from the intended rule (Widget has
-- priority; Index is scored only when no widget is connected). Since
-- seed.sql only inserts on conflict do nothing, a database seeded before
-- this fix needs this explicit correction.
update public.exclusive_groups
set
  explainer = 'If a business connects both a review widget and review index tracking, only the widget score counts; the four Review Index fields are scored only when no widget is connected.',
  paths = '[{"path_key":"widget","path_label":"Through Widget","members":["through_widget"]},{"path_key":"index","path_label":"Review Index","members":["review_index_rating_on_each","review_index_text","review_index_location","review_index_date"]}]'::jsonb
where group_key = 'review_source';
