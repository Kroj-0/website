import os
import json

# Directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))
print("Script is located in:", script_dir)

# The path to your reports directory from the perspective of this script
# You will need to change this to the actual path on your server.
reports_directory = script_dir

# The path where the final JSON file should be saved (inside the reports directory)
output_json_path = os.path.join(reports_directory, 'reports.json')

try:
    # Get all entries in the directory and filter for those that are directories
    all_entries = os.listdir(reports_directory)
    report_dirs = [d for d in all_entries if os.path.isdir(os.path.join(reports_directory, d))]

    # Filter out any non-numeric directories to be safe
    report_ids = sorted([d for d in report_dirs if d.isdigit()], key=int, reverse=True)

    # Write the list to the JSON file
    with open(output_json_path, 'w') as f:
        json.dump(report_ids, f)

    print(f"Successfully generated reports.json with {len(report_ids)} reports.")
    print(f"File saved to: {output_json_path}")

except FileNotFoundError:
    print(f"Error: The directory '{reports_directory}' was not found. Please check the path.")
except Exception as e:
    print(f"An error occurred: {e}")