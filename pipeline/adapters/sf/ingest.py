"""SF crime ingestion adapter.

Downloads SF crime CSV from Socrata and loads into the raw incident table.

Data sources:
  Current (2018–present):    https://data.sfgov.org/api/views/wg3w-h783/rows.csv?accessType=DOWNLOAD
  Historical (2003–2017):    https://data.sfgov.org/api/views/tmnf-yvry/rows.csv?accessType=DOWNLOAD

NOTE: These two datasets have different field names — a known SF gotcha.
Field mapping to the unified incident model is TODO pending the schema spike.
"""

# TODO (schema spike): define unified incident model and map SF fields to it.
# TODO (schema spike): confirm field names differ between historical and current datasets.
# TODO: log dropped/unplaceable rows — never drop silently (CLAUDE.md guardrail).

SF_CRIME_RECENT_URL = (
    "https://data.sfgov.org/api/views/wg3w-h783/rows.csv?accessType=DOWNLOAD"
)
SF_CRIME_HISTORICAL_URL = (
    "https://data.sfgov.org/api/views/tmnf-yvry/rows.csv?accessType=DOWNLOAD"
)
