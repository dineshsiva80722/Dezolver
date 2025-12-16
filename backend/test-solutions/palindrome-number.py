# Palindrome Number Solution
x = int(input())

# Negative numbers are not palindromes
if x < 0:
    print("false")
else:
    # Convert to string and check if it's the same when reversed
    str_x = str(x)
    if str_x == str_x[::-1]:
        print("true")
    else:
        print("false")