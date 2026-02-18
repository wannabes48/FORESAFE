import csv

def generate_csv(filename, count):
    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['tag_id']) # Header for your database import
        for i in range(1, count + 1):
            tag_id = f"FS-{i:04d}"
            writer.writerow([tag_id])

if __name__ == "__main__":
    generate_csv('tags.csv', 1000)
    print("tags.csv generated successfully with 1000 tags.")