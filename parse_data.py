#!/usr/bin/env python3
"""Parse CSV files and generate models.json for the website."""

import csv
import json
import re

def clean_text(text):
    """Clean and normalize text."""
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r'\n+', '\n', text)
    return text

def get_field(row, field):
    """Get field from row, handling BOM prefix."""
    if field in row:
        return row[field]
    bom_field = '\ufeff' + field
    if bom_field in row:
        return row[bom_field]
    return ''

def parse_csv(filepath, category):
    """Parse a CSV file and return a list of model dicts."""
    models = []
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = clean_text(get_field(row, 'Model'))
            if not name:
                continue
            
            paper = clean_text(get_field(row, 'Paper'))
            code = clean_text(get_field(row, 'Code'))
            time_str = clean_text(get_field(row, 'Time'))
            
            # Skip entries without paper link and time
            if not paper and not time_str:
                continue
            
            model = {
                'name': name,
                'category': category,
                'io': clean_text(get_field(row, 'IO')),
                'tokenizer': clean_text(get_field(row, 'Tokenizer')),
                'backbone': clean_text(get_field(row, 'Backbone')),
                'parameter': clean_text(get_field(row, 'Parameter')),
                'task': clean_text(get_field(row, 'Task')),
                'dataset': clean_text(get_field(row, 'Dataset&Benchmark')),
                'metric': clean_text(get_field(row, 'Metric')),
                'time': time_str,
                'code': code,
                'paper': paper,
                'ps': clean_text(get_field(row, 'PS')),
                'conference': clean_text(get_field(row, 'Conference/Journal')),
                'area': clean_text(get_field(row, 'area')),
                'highlight': clean_text(get_field(row, 'highlight')),
                'citation': clean_text(get_field(row, 'citation')),
            }
            models.append(model)
    return models

def main():
    ar_models = parse_csv('data/Related MLLM - AR.csv', 'Auto-Regressive')
    diff_models = parse_csv('data/Related MLLM - Diffusion.csv', 'Diffusion')
    ar_diff_models = parse_csv('data/Related MLLM - AR&Diffusion.csv', 'AR & Diffusion')
    
    all_models = ar_models + diff_models + ar_diff_models
    
    # Sort by time (newest first)
    def sort_key(m):
        t = m.get('time', '')
        return t if t else '0000'
    
    all_models.sort(key=sort_key, reverse=True)
    
    print(f"Parsed {len(ar_models)} AR models, {len(diff_models)} Diffusion models, {len(ar_diff_models)} AR&Diffusion models")
    print(f"Total: {len(all_models)} models")
    
    # Print some model names for verification
    for m in all_models[:5]:
        print(f"  - {m['name']} ({m['category']}, {m['time']})")
    
    with open('models.json', 'w', encoding='utf-8') as f:
        json.dump(all_models, f, ensure_ascii=False, indent=2)
    
    print("Generated models.json successfully!")

if __name__ == '__main__':
    main()
