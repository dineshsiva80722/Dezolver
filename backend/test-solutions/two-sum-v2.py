# Two Sum V2 Solution
n = int(input())
nums = list(map(int, input().split()))
target = int(input())

# Create a hash map to store value -> index
num_map = {}

for i in range(n):
    complement = target - nums[i]
    if complement in num_map:
        print(num_map[complement], i)
        break
    num_map[nums[i]] = i