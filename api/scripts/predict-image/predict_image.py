import torch
from torchvision import transforms
from torchvision.models import resnet18
from PIL import Image
import urllib.request
import sys
import os

image_path = sys.argv[1]

# URLs
categories_url = 'https://raw.githubusercontent.com/CSAILVision/places365/master/categories_places365.txt'
model_url = 'http://places2.csail.mit.edu/models_places365/resnet18_places365.pth.tar'

# Local paths
categories_path = 'categories_places365.txt'
model_path = 'resnet18_places365.pth.tar'

# Download files only if not present
if not os.path.exists(categories_path):
    urllib.request.urlretrieve(categories_url, categories_path)

if not os.path.exists(model_path):
    urllib.request.urlretrieve(model_url, model_path)

# Load scene categories
classes = []
with open(categories_path) as class_file:
    for line in class_file:
        classes.append(line.strip().split(' ')[0][3:])

# Load the pre-trained model
model = resnet18(num_classes=365)
checkpoint = torch.load(model_path, map_location=lambda storage, loc: storage)
state_dict = {k.replace('module.', ''): v for k, v in checkpoint['state_dict'].items()}
model.load_state_dict(state_dict)
model.eval()

# Image transforms
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406], 
        std=[0.229, 0.224, 0.225])
])

# Load and preprocess the image
image_url = image_path
image = Image.open(urllib.request.urlopen(image_url)).convert('RGB')
input_img = transform(image).unsqueeze(0)  # Add batch dimension

# Run inference
with torch.no_grad():
    logits = model(input_img)
    probs = torch.nn.functional.softmax(logits, dim=1)
    top_probs, top_idxs = probs.topk(5)

# Print top-5 predictions
for i in range(top_probs.size(1)):
    print(f"{classes[top_idxs[0, i]]}: {top_probs[0, i].item() * 100:.2f}%")
