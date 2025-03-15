import sys
import pandas as pd
import numpy as np
import json

print("hello from python script.............")
jsonString = '{"a": "121", "b": "9"}'
print("json-str created...")
x = np.array(['1.1', '2.2', '3.3'])
y = x.astype(np.float)
t = np.sum(y)
print("t:" + t.astype(str))

# cant get conversion to numbers to sum them to work..
# want to be able to work with objects eg user 
# and arraya passed through in json format
dict = json.loads(jsonString);
its = dict.items()
print("a...")
list_its = list(its)
print("b...")
arr_its = np.array(list_its)
print("c...")
arr_nrs = arr_its.astype(np.float)
print("d...")
total = np.sum(arr_nrs)
print("total calculated...")
print("total: " + total.astype(str))


# d = {'col1': [1, 2], 'col2': [3, 4]}
# df = pd.DataFrame(data=d);
# print(df)

print('Welcome to python-'+sys.argv[1])