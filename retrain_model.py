# retrain_model.py
from pathlib import Path
import argparse
import sys
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib


def resolve_dataset_path(cli_path: str | None) -> Path:
    if cli_path:
        path = Path(cli_path)
        if not path.exists():
            raise FileNotFoundError(f"Dataset file not found: {path}")
        return path

    candidates = [
        Path("learning_dataset.csv"),
        Path("phishing_dataset.csv"),
        Path("data/learning_dataset.csv"),
        Path("data/phishing_dataset.csv"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        "No dataset CSV found. Use --data <path-to-dataset.csv>.\n"
        "Tried: learning_dataset.csv, phishing_dataset.csv, "
        "data/learning_dataset.csv, data/phishing_dataset.csv"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Retrain phishing model from CSV.")
    parser.add_argument("--data", help="Path to CSV dataset containing a 'label' column.")
    parser.add_argument("--out", default="phishing_model.pkl", help="Output model path.")
    args = parser.parse_args()

    dataset_path = resolve_dataset_path(args.data)
    data = pd.read_csv(dataset_path)

    if "label" not in data.columns:
        raise ValueError(
            f"Dataset must contain a 'label' column. Got columns: {list(data.columns)}"
        )

    X = data.drop("label", axis=1)
    y = data["label"]

    model = RandomForestClassifier()
    model.fit(X, y)
    joblib.dump(model, args.out)

    print(f"Model retrained from {dataset_path} and saved to {args.out}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)
