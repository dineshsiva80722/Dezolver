# Reverse Integer Solution
x = int(input())

# Handle sign
sign = -1 if x < 0 else 1
x = abs(x)

# Reverse the number
reversed_num = 0
while x > 0:
    reversed_num = reversed_num * 10 + x % 10
    x //= 10

# Apply sign
reversed_num *= sign

# Check for 32-bit integer overflow
if reversed_num < -2**31 or reversed_num > 2**31 - 1:
    print(0)
else:
    print(reversed_num)