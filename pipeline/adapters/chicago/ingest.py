"""Chicago crime ingestion adapter.

Downloads Chicago crime CSV from Socrata and loads into the raw incident table.

Data sources:
  Crimes (2001–present):    https://data.cityofchicago.org/api/views/ijzp-q8t2/rows.csv?accessType=DOWNLOAD

NOTE: Chicago uses IUCR codes and a binary Arrest boolean — different from SF's
Resolution field. See docs/spikes/schema_spike.md for SF findings; Chicago schema
spike findings should be added there once complete.

Known gotchas (verify during Chicago schema spike):
  - Locations anonymized to the hundred-block, not exact address
  - Some records have no coordinates
  - Arrest boolean is not the same as clearance/resolution
"""

# TODO (Chicago schema spike): catalog all Chicago fields and map to unified incident model.
# TODO (Chicago schema spike): verify dataset ID ijzp-q8t2 on data.cityofchicago.org.
# TODO (Chicago schema spike): determine whether proactive/reactive distinction is available.
# TODO: log dropped/unplaceable rows — never drop silently (CLAUDE.md guardrail).

CHICAGO_CRIME_URL = (
    "https://data.cityofchicago.org/api/views/ijzp-q8t2/rows.csv?accessType=DOWNLOAD"
)
