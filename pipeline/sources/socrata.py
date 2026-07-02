import pandas as pd
import requests
from io import BytesIO


def fetch_csv(url: str) -> pd.DataFrame:
    """Download a Socrata bulk CSV export and return a DataFrame.

    Use the bulk export URL, not the paged API — for 10M rows the API
    requires thousands of paginated requests; the CSV export is one download.

    Example URL format:
        https://data.sfgov.org/api/views/{dataset_id}/rows.csv?accessType=DOWNLOAD
    """
    response = requests.get(url, timeout=300)
    response.raise_for_status()
    return pd.read_csv(BytesIO(response.content), low_memory=False)

# https://requests.readthedocs.io
# https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html
