from brisque import BRISQUE
import sys

from libsvm import svmutil
svmutil.PRECOMPUTED = 4


image_path = sys.argv[1]

obj = BRISQUE(url=True)
score = obj.score(image_path)
print(score)
