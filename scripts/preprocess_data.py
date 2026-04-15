from __future__ import annotations

import json
import shutil
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
DATASETS_DIR = BASE_DIR / "datasets"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
SITE_DATA_DIR = BASE_DIR / "docs" / "data"


def ensure_directories() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    SITE_DATA_DIR.mkdir(parents=True, exist_ok=True)


def standardize_flag(series: pd.Series) -> pd.Series:
    standardized = (
        series.fillna("unknown")
        .astype(str)
        .str.strip()
        .str.upper()
        .replace({"": "UNKNOWN", "NAN": "UNKNOWN"})
    )
    return standardized.str.replace(r"^UNKNOWN(?:[-_].*)?$", "UNKNOWN", regex=True).replace({"UNK": "UNKNOWN"})


def write_csv(df: pd.DataFrame, filename: str) -> None:
    processed_path = PROCESSED_DIR / filename
    site_path = SITE_DATA_DIR / filename
    df.to_csv(processed_path, index=False)
    shutil.copy2(processed_path, site_path)


def write_json(payload: dict, filename: str) -> None:
    processed_path = PROCESSED_DIR / filename
    site_path = SITE_DATA_DIR / filename
    processed_path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    shutil.copy2(processed_path, site_path)


def month_name(month_number: int) -> str:
    return pd.Timestamp(year=2022, month=int(month_number), day=1).strftime("%b")


def build_gap_outputs() -> dict:
    gaps = pd.read_csv(DATASETS_DIR / "unseen_fishing_vessels.csv")

    gaps["gap_start_timestamp"] = pd.to_datetime(gaps["gap_start_timestamp"], utc=True, errors="coerce")
    gaps["gap_end_timestamp"] = pd.to_datetime(gaps["gap_end_timestamp"], utc=True, errors="coerce")

    numeric_columns = [
        "vessel_length_m",
        "vessel_tonnage_gt",
        "gap_start_lat",
        "gap_start_lon",
        "gap_start_distance_from_shore_m",
        "gap_end_lat",
        "gap_end_lon",
        "gap_end_distance_from_shore_m",
        "gap_hours",
    ]
    for column in numeric_columns:
        gaps[column] = pd.to_numeric(gaps[column], errors="coerce")

    gaps["flag"] = standardize_flag(gaps["flag"])
    gaps["vessel_class"] = gaps["vessel_class"].fillna("unknown").astype(str).str.strip().replace({"": "unknown"})
    gaps["gap_start_month_period"] = gaps["gap_start_timestamp"].dt.tz_convert(None).dt.to_period("M").astype(str)
    gaps["gap_start_month"] = gaps["gap_start_timestamp"].dt.month
    gaps["gap_start_lat_bin_1deg"] = gaps["gap_start_lat"].floordiv(1).astype("Int64")
    gaps["gap_start_lon_bin_1deg"] = gaps["gap_start_lon"].floordiv(1).astype("Int64")

    gap_monthly = (
        gaps.groupby("gap_start_month_period", dropna=False)
        .agg(
            gap_count=("gap_id", "count"),
            unique_vessels=("mmsi", pd.Series.nunique),
            unique_flags=("flag", pd.Series.nunique),
            total_gap_hours=("gap_hours", "sum"),
            average_gap_hours=("gap_hours", "mean"),
            median_gap_hours=("gap_hours", "median"),
        )
        .reset_index()
        .rename(columns={"gap_start_month_period": "month_period"})
        .sort_values("month_period")
    )

    gap_flag = (
        gaps.groupby("flag", dropna=False)
        .agg(
            gap_count=("gap_id", "count"),
            unique_vessels=("mmsi", pd.Series.nunique),
            total_gap_hours=("gap_hours", "sum"),
            average_gap_hours=("gap_hours", "mean"),
        )
        .reset_index()
        .sort_values("gap_count", ascending=False)
    )
    gap_flag["share_of_all_gaps"] = gap_flag["gap_count"] / gap_flag["gap_count"].sum()

    gap_vessel_class = (
        gaps.groupby(["vessel_class", "flag"], dropna=False)
        .agg(
            gap_count=("gap_id", "count"),
            total_gap_hours=("gap_hours", "sum"),
        )
        .reset_index()
        .sort_values(["vessel_class", "gap_count"], ascending=[True, False])
    )

    gap_spatial = (
        gaps.groupby(["gap_start_month_period", "gap_start_lat_bin_1deg", "gap_start_lon_bin_1deg"], dropna=False)
        .agg(
            gap_count=("gap_id", "count"),
            total_gap_hours=("gap_hours", "sum"),
            unique_vessels=("mmsi", pd.Series.nunique),
        )
        .reset_index()
        .rename(
            columns={
                "gap_start_month_period": "month_period",
                "gap_start_lat_bin_1deg": "lat_bin_1deg",
                "gap_start_lon_bin_1deg": "lon_bin_1deg",
            }
        )
        .sort_values(["month_period", "gap_count"], ascending=[True, False])
    )

    gap_seasonality = (
        gaps.groupby("gap_start_month", dropna=False)
        .agg(
            gap_count=("gap_id", "count"),
            total_gap_hours=("gap_hours", "sum"),
        )
        .reset_index()
        .rename(columns={"gap_start_month": "month"})
        .sort_values("month")
    )
    gap_seasonality["month_name"] = gap_seasonality["month"].apply(month_name)
    gap_seasonality["gap_count_share"] = gap_seasonality["gap_count"] / gap_seasonality["gap_count"].sum()
    gap_seasonality["gap_hours_share"] = gap_seasonality["total_gap_hours"] / gap_seasonality["total_gap_hours"].sum()

    write_csv(gaps, "gap_events_clean.csv")
    write_csv(gap_monthly, "gap_monthly_summary.csv")
    write_csv(gap_flag, "gap_flag_summary.csv")
    write_csv(gap_vessel_class, "gap_vessel_class_summary.csv")
    write_csv(gap_spatial, "gap_spatial_1deg_summary.csv")
    write_csv(gap_seasonality, "gap_seasonality_profile.csv")

    return {
        "rows": int(len(gaps)),
        "coverage": {
            "start": str(gaps["gap_start_month_period"].dropna().min()),
            "end": str(gaps["gap_start_month_period"].dropna().max()),
        },
    }


def build_fleet_outputs() -> dict:
    monthly_dir = DATASETS_DIR / "monthly_fleet_data"
    monthly_files = sorted(monthly_dir.glob("fleet-monthly-csvs-10-v3-*.csv"))

    month_summary_frames = []
    flag_summary_frames = []
    gear_summary_frames = []
    spatial_summary_frames = []
    row_total = 0

    for path in monthly_files:
        frame = pd.read_csv(
            path,
            usecols=[
                "date",
                "year",
                "month",
                "cell_ll_lat",
                "cell_ll_lon",
                "flag",
                "geartype",
                "hours",
                "fishing_hours",
                "mmsi_present",
            ],
        )

        frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
        frame["month_period"] = frame["date"].dt.to_period("M").astype(str)
        frame["month_number"] = frame["date"].dt.month
        frame["flag"] = standardize_flag(frame["flag"])
        frame["geartype"] = frame["geartype"].fillna("unknown").astype(str).str.strip().replace({"": "unknown"})

        for column in ["cell_ll_lat", "cell_ll_lon", "hours", "fishing_hours", "mmsi_present"]:
            frame[column] = pd.to_numeric(frame[column], errors="coerce")

        frame["lat_bin_1deg"] = frame["cell_ll_lat"].floordiv(1).astype("Int64")
        frame["lon_bin_1deg"] = frame["cell_ll_lon"].floordiv(1).astype("Int64")

        month_summary_frames.append(
            pd.DataFrame(
                [
                    {
                        "month_period": frame["month_period"].iloc[0],
                        "month": int(frame["month_number"].iloc[0]),
                        "month_name": month_name(frame["month_number"].iloc[0]),
                        "grid_rows": int(len(frame)),
                        "total_hours": float(frame["hours"].sum()),
                        "total_fishing_hours": float(frame["fishing_hours"].sum()),
                        "vessel_presence": float(frame["mmsi_present"].sum()),
                        "unique_flags": int(frame["flag"].nunique()),
                        "unique_geartypes": int(frame["geartype"].nunique()),
                    }
                ]
            )
        )

        flag_summary_frames.append(
            frame.groupby("flag", dropna=False)
            .agg(
                grid_rows=("hours", "count"),
                total_hours=("hours", "sum"),
                total_fishing_hours=("fishing_hours", "sum"),
                vessel_presence=("mmsi_present", "sum"),
            )
            .reset_index()
            .assign(month_period=frame["month_period"].iloc[0])
        )

        gear_summary_frames.append(
            frame.groupby("geartype", dropna=False)
            .agg(
                grid_rows=("hours", "count"),
                total_hours=("hours", "sum"),
                total_fishing_hours=("fishing_hours", "sum"),
                vessel_presence=("mmsi_present", "sum"),
            )
            .reset_index()
            .assign(month_period=frame["month_period"].iloc[0])
        )

        spatial_summary_frames.append(
            frame.groupby(["month_period", "lat_bin_1deg", "lon_bin_1deg"], dropna=False)
            .agg(
                grid_rows=("hours", "count"),
                total_hours=("hours", "sum"),
                total_fishing_hours=("fishing_hours", "sum"),
                vessel_presence=("mmsi_present", "sum"),
            )
            .reset_index()
        )

        row_total += int(len(frame))

    month_summary = pd.concat(month_summary_frames, ignore_index=True).sort_values("month_period")

    flag_summary = (
        pd.concat(flag_summary_frames, ignore_index=True)
        .groupby("flag", as_index=False)
        .agg(
            grid_rows=("grid_rows", "sum"),
            total_hours=("total_hours", "sum"),
            total_fishing_hours=("total_fishing_hours", "sum"),
            vessel_presence=("vessel_presence", "sum"),
        )
        .sort_values("total_hours", ascending=False)
    )

    gear_summary = (
        pd.concat(gear_summary_frames, ignore_index=True)
        .groupby("geartype", as_index=False)
        .agg(
            grid_rows=("grid_rows", "sum"),
            total_hours=("total_hours", "sum"),
            total_fishing_hours=("total_fishing_hours", "sum"),
            vessel_presence=("vessel_presence", "sum"),
        )
        .sort_values("total_hours", ascending=False)
    )

    spatial_summary = (
        pd.concat(spatial_summary_frames, ignore_index=True)
        .groupby(["month_period", "lat_bin_1deg", "lon_bin_1deg"], as_index=False)
        .agg(
            grid_rows=("grid_rows", "sum"),
            total_hours=("total_hours", "sum"),
            total_fishing_hours=("total_fishing_hours", "sum"),
            vessel_presence=("vessel_presence", "sum"),
        )
        .sort_values(["month_period", "grid_rows"], ascending=[True, False])
    )

    seasonality = month_summary[["month", "month_name", "total_hours", "total_fishing_hours", "vessel_presence"]].copy()
    seasonality["hours_share"] = seasonality["total_hours"] / seasonality["total_hours"].sum()
    seasonality["fishing_hours_share"] = seasonality["total_fishing_hours"] / seasonality["total_fishing_hours"].sum()

    write_csv(month_summary, "fleet_monthly_summary.csv")
    write_csv(flag_summary, "fleet_flag_summary.csv")
    write_csv(gear_summary, "fleet_gear_summary.csv")
    write_csv(spatial_summary, "fleet_spatial_1deg_summary.csv")
    write_csv(seasonality, "fleet_seasonality_profile.csv")

    return {
        "rows": row_total,
        "coverage": {
            "start": str(month_summary["month_period"].min()),
            "end": str(month_summary["month_period"].max()),
        },
    }


def build_comparison_outputs(gap_manifest: dict, fleet_manifest: dict) -> None:
    gap_seasonality = pd.read_csv(PROCESSED_DIR / "gap_seasonality_profile.csv")
    fleet_seasonality = pd.read_csv(PROCESSED_DIR / "fleet_seasonality_profile.csv")

    comparison = gap_seasonality[["month", "month_name", "gap_count", "gap_count_share", "total_gap_hours", "gap_hours_share"]].merge(
        fleet_seasonality[["month", "total_hours", "hours_share", "total_fishing_hours", "fishing_hours_share"]],
        on="month",
        how="outer",
    )
    comparison = comparison.sort_values("month")
    write_csv(comparison, "seasonality_comparison.csv")

    write_json(
        {
            "project": "Invisible fleet vs apparent fishing effort",
            "note": "The vessel-gap data spans 2017-01 to 2019-12. The monthly fleet-effort files span 2022-01 to 2022-12, so the site should compare standardized summaries and seasonal profiles rather than implying the two sources overlap in the same year.",
            "outputs": [
                "gap_events_clean.csv",
                "gap_monthly_summary.csv",
                "gap_flag_summary.csv",
                "gap_vessel_class_summary.csv",
                "gap_spatial_1deg_summary.csv",
                "gap_seasonality_profile.csv",
                "fleet_monthly_summary.csv",
                "fleet_flag_summary.csv",
                "fleet_gear_summary.csv",
                "fleet_spatial_1deg_summary.csv",
                "fleet_seasonality_profile.csv",
                "seasonality_comparison.csv",
            ],
            "coverage": {
                "gap_dataset": gap_manifest["coverage"],
                "fleet_dataset": fleet_manifest["coverage"],
            },
        },
        "data_manifest.json",
    )


def main() -> None:
    ensure_directories()
    gap_manifest = build_gap_outputs()
    fleet_manifest = build_fleet_outputs()
    build_comparison_outputs(gap_manifest, fleet_manifest)
    print(f"Wrote processed outputs to {PROCESSED_DIR}")
    print(f"Copied site-ready outputs to {SITE_DATA_DIR}")


if __name__ == "__main__":
    main()
