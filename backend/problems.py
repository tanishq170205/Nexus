# ============================================================
# NEXUS Interview Engine — Multi-Domain Problem Pools
# DSA (12 problems), SQL (4 problems), ML (3 problems),
# React/Web (3 problems) — each with real test cases,
# editorials and per-language starter code.
# ============================================================

# ─── DSA Pool (LeetCode Medium/Hard) ────────────────────────
DSA_POOL = [
    {
        "id": "146", "slug": "lru-cache", "title": "LRU Cache", "difficulty": "Hard",
        "source": "LeetCode", "question_type": "coding",
        "default_lang": "python3",
        "content": """<p>Design a data structure that follows the constraints of a <strong>Least Recently Used (LRU) cache</strong>.</p>
<p>Implement the <code>LRUCache</code> class:</p>
<ul>
<li><code>LRUCache(int capacity)</code> — Initialize with positive size <code>capacity</code>.</li>
<li><code>int get(int key)</code> — Return the value of the key if it exists, otherwise return <code>-1</code>.</li>
<li><code>void put(int key, int value)</code> — Update or insert key-value. Evict the LRU key if over capacity.</li>
</ul>
<p>Both <code>get</code> and <code>put</code> must run in <strong>O(1)</strong> average time complexity.</p>
<p><strong>Example:</strong></p>
<pre>Input: ["LRUCache","put","put","get","put","get","put","get","get","get"]
       [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]
Output: [null,null,null,1,null,-1,null,-1,3,4]</pre>
<p><strong>Constraints:</strong> 1 ≤ capacity ≤ 3000 · 0 ≤ key ≤ 10⁴ · At most 2×10⁵ calls.</p>""",
        "editorial": "Use a HashMap for O(1) key lookup + a Doubly Linked List for O(1) node promotion/eviction. On get: move node to head. On put: insert at head; if over capacity, remove tail. Use dummy head/tail nodes to avoid edge cases.",
        "test_cases": [
            {"input": 'capacity=2\nops=["put","put","get","put","get","put","get","get","get"]\nargs=[[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', "expected": "[null,null,1,null,-1,null,-1,3,4]"},
            {"input": 'capacity=1\nops=["put","put"]\nargs=[[2,1],[3,2]]', "expected": "[null,null]"},
        ],
        "snippets": {
            "python3": "class LRUCache:\n\n    def __init__(self, capacity: int):\n        \n\n    def get(self, key: int) -> int:\n        \n\n    def put(self, key: int, value: int) -> None:\n        \n\n\n# obj = LRUCache(capacity)\n# param_1 = obj.get(key)\n# obj.put(key,value)",
            "javascript": "var LRUCache = function(capacity) {\n    \n};\nLRUCache.prototype.get = function(key) {\n    \n};\nLRUCache.prototype.put = function(key, value) {\n    \n};",
            "java": "class LRUCache {\n    public LRUCache(int capacity) { }\n    public int get(int key) { return -1; }\n    public void put(int key, int value) { }\n}",
            "cpp": "class LRUCache {\npublic:\n    LRUCache(int capacity) { }\n    int get(int key) { return -1; }\n    void put(int key, int value) { }\n};",
            "c": "typedef struct { } LRUCache;\nLRUCache* lRUCacheCreate(int capacity) { return NULL; }\nint lRUCacheGet(LRUCache* obj, int key) { return -1; }\nvoid lRUCachePut(LRUCache* obj, int key, int value) { }\nvoid lRUCacheFree(LRUCache* obj) { }",
            "typescript": "class LRUCache {\n    constructor(capacity: number) { }\n    get(key: number): number { return -1; }\n    put(key: number, value: number): void { }\n}",
            "golang": "type LRUCache struct{}\nfunc Constructor(capacity int) LRUCache { return LRUCache{} }\nfunc (this *LRUCache) Get(key int) int { return -1 }\nfunc (this *LRUCache) Put(key int, value int) { }",
        }
    },
    {
        "id": "56", "slug": "merge-intervals", "title": "Merge Intervals", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>Given an array of <code>intervals</code> where <code>intervals[i] = [startᵢ, endᵢ]</code>, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: intervals = [[1,4],[4,5]]
Output: [[1,5]]</pre>
<p><strong>Constraints:</strong> 1 ≤ intervals.length ≤ 10⁴ · 0 ≤ startᵢ ≤ endᵢ ≤ 10⁴</p>""",
        "editorial": "Sort intervals by start time. Iterate: if current.start ≤ last_merged.end, extend last_merged.end = max(last_merged.end, current.end). Otherwise append current. O(n log n) time.",
        "test_cases": [
            {"input": "intervals = [[1,3],[2,6],[8,10],[15,18]]", "expected": "[[1,6],[8,10],[15,18]]"},
            {"input": "intervals = [[1,4],[4,5]]", "expected": "[[1,5]]"},
            {"input": "intervals = [[1,4],[0,4]]", "expected": "[[0,4]]"},
        ],
        "snippets": {
            "python3": "from typing import List\n\nclass Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        ",
            "javascript": "var merge = function(intervals) {\n    \n};",
            "java": "class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};",
            "c": "int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) { return NULL; }",
            "typescript": "function merge(intervals: number[][]): number[][] {\n    \n};",
            "golang": "func merge(intervals [][]int) [][]int {\n    \n}",
        }
    },
    {
        "id": "322", "slug": "coin-change", "title": "Coin Change", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>You are given an integer array <code>coins</code> representing coins of different denominations and an integer <code>amount</code> representing a total amount of money.</p>
<p>Return the <em>fewest number of coins</em> needed to make up that amount. If it cannot be made up, return <code>-1</code>. You may use each coin type an unlimited number of times.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: coins = [1,5,11], amount = 11  →  Output: 1</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: coins = [1,5,11], amount = 15  →  Output: 3</pre>
<p><strong>Example 3:</strong></p>
<pre>Input: coins = [2], amount = 3  →  Output: -1</pre>
<p><strong>Constraints:</strong> 1 ≤ coins.length ≤ 12 · 0 ≤ amount ≤ 10⁴</p>""",
        "editorial": "Bottom-up DP. dp[i] = min coins to make amount i. Init dp[0]=0, rest=∞. For each coin, for each amount a ≥ coin: dp[a] = min(dp[a], dp[a-coin]+1). Return dp[amount] if finite, else -1.",
        "test_cases": [
            {"input": "coins = [1,5,11], amount = 11", "expected": "1"},
            {"input": "coins = [1,5,11], amount = 15", "expected": "3"},
            {"input": "coins = [2], amount = 3", "expected": "-1"},
        ],
        "snippets": {
            "python3": "from typing import List\n\nclass Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        ",
            "javascript": "var coinChange = function(coins, amount) {\n    \n};",
            "java": "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};",
            "c": "int coinChange(int* coins, int coinsSize, int amount) { return -1; }",
            "typescript": "function coinChange(coins: number[], amount: number): number {\n    \n};",
            "golang": "func coinChange(coins []int, amount int) int {\n    \n}",
        }
    },
    {
        "id": "42", "slug": "trapping-rain-water", "title": "Trapping Rain Water", "difficulty": "Hard",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>Given <code>n</code> non-negative integers representing an elevation map where the width of each bar is <code>1</code>, compute how much water it can trap after raining.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: height = [4,2,0,3,2,5]
Output: 9</pre>
<p><strong>Constraints:</strong> n == height.length · 1 ≤ n ≤ 2×10⁴ · 0 ≤ height[i] ≤ 10⁵</p>""",
        "editorial": "Two-pointer: maintain left_max and right_max. If left_max < right_max: water += left_max − height[left], move left++. Else: water += right_max − height[right], move right--. O(n) time, O(1) space.",
        "test_cases": [
            {"input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]", "expected": "6"},
            {"input": "height = [4,2,0,3,2,5]", "expected": "9"},
            {"input": "height = [3,0,2,0,4]", "expected": "7"},
        ],
        "snippets": {
            "python3": "from typing import List\n\nclass Solution:\n    def trap(self, height: List[int]) -> int:\n        ",
            "javascript": "var trap = function(height) {\n    \n};",
            "java": "class Solution {\n    public int trap(int[] height) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};",
            "c": "int trap(int* height, int heightSize) { return 0; }",
            "typescript": "function trap(height: number[]): number {\n    \n};",
            "golang": "func trap(height []int) int {\n    \n}",
        }
    },
    {
        "id": "200", "slug": "number-of-islands", "title": "Number of Islands", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>Given an <code>m x n</code> 2D binary grid of <code>'1'</code>s (land) and <code>'0'</code>s (water), return the <em>number of islands</em>.</p>
<p>An <strong>island</strong> is formed by connecting adjacent land cells horizontally or vertically.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: grid = [["1","1","0"],["0","1","0"],["0","0","1"]]
Output: 2</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: grid = [["1","1","1"],["0","1","0"],["1","1","1"]]
Output: 1</pre>
<p><strong>Constraints:</strong> 1 ≤ m, n ≤ 300 · grid[i][j] is '0' or '1'.</p>""",
        "editorial": "DFS/BFS from each unvisited '1'. Flood-fill all connected '1's to '0' to mark visited. Increment island counter for each DFS start. O(m×n) time.",
        "test_cases": [
            {"input": 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', "expected": "2"},
            {"input": 'grid = [["1","1","1"],["0","1","0"],["1","1","1"]]', "expected": "1"},
        ],
        "snippets": {
            "python3": "from typing import List\n\nclass Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        ",
            "javascript": "var numIslands = function(grid) {\n    \n};",
            "java": "class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};",
            "c": "int numIslands(char** grid, int gridSize, int* gridColSize) { return 0; }",
            "typescript": "function numIslands(grid: string[][]): number {\n    \n};",
            "golang": "func numIslands(grid [][]byte) int {\n    \n}",
        }
    },
    {
        "id": "76", "slug": "minimum-window-substring", "title": "Minimum Window Substring", "difficulty": "Hard",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>Given two strings <code>s</code> and <code>t</code>, return the <strong>minimum window substring</strong> of <code>s</code> such that every character in <code>t</code> (including duplicates) is included. Return <code>""</code> if no such window exists.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "ADOBECODEBANC", t = "ABC"  →  Output: "BANC"</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "a", t = "aa"  →  Output: ""</pre>
<p><strong>Constraints:</strong> 1 ≤ |s|, |t| ≤ 10⁵ · s and t consist of uppercase and lowercase letters.</p>""",
        "editorial": "Sliding window. Expand right until all chars of t are covered (use frequency map + 'formed' counter). Then shrink left to minimize, tracking the minimum window seen. O(|s|+|t|) time.",
        "test_cases": [
            {"input": 's = "ADOBECODEBANC", t = "ABC"', "expected": '"BANC"'},
            {"input": 's = "a", t = "aa"', "expected": '""'},
            {"input": 's = "aa", t = "aa"', "expected": '"aa"'},
        ],
        "snippets": {
            "python3": "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        ",
            "javascript": "var minWindow = function(s, t) {\n    \n};",
            "java": "class Solution {\n    public String minWindow(String s, String t) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    string minWindow(string s, string t) {\n        \n    }\n};",
            "c": 'char* minWindow(char* s, char* t) { return ""; }',
            "typescript": "function minWindow(s: string, t: string): string {\n    \n};",
            "golang": 'func minWindow(s string, t string) string {\n    \n}',
        }
    },
    {
        "id": "347", "slug": "top-k-frequent-elements", "title": "Top K Frequent Elements", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>Given an integer array <code>nums</code> and an integer <code>k</code>, return the <code>k</code> most frequent elements. You may return the answer in any order.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [1,1,1,2,2,3], k = 2  →  Output: [1,2]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [1], k = 1  →  Output: [1]</pre>
<p><strong>Constraints:</strong> 1 ≤ nums.length ≤ 10⁵ · Answer is unique · Better than O(n log n) expected.</p>""",
        "editorial": "Count frequencies with HashMap. Bucket sort: array[freq] = [elements]. Fill from highest bucket down until k elements collected. O(n) time. Or use min-heap of size k → O(n log k).",
        "test_cases": [
            {"input": "nums = [1,1,1,2,2,3], k = 2", "expected": "[1,2]"},
            {"input": "nums = [1], k = 1", "expected": "[1]"},
            {"input": "nums = [4,1,1,2,2,3,3,3], k = 2", "expected": "[3,1] or [3,2]"},
        ],
        "snippets": {
            "python3": "from typing import List\n\nclass Solution:\n    def topKFrequent(self, nums: List[int], k: int) -> List[int]:\n        ",
            "javascript": "var topKFrequent = function(nums, k) {\n    \n};",
            "java": "class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        \n    }\n};",
            "c": "int* topKFrequent(int* nums, int numsSize, int k, int* returnSize) { return NULL; }",
            "typescript": "function topKFrequent(nums: number[], k: number): number[] {\n    \n};",
            "golang": "func topKFrequent(nums []int, k int) []int {\n    \n}",
        }
    },
    {
        "id": "5", "slug": "longest-palindromic-substring", "title": "Longest Palindromic Substring", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>Given a string <code>s</code>, return the <em>longest palindromic substring</em> in <code>s</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "babad"  →  Output: "bab"  (or "aba")</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "cbbd"  →  Output: "bb"</pre>
<p><strong>Constraints:</strong> 1 ≤ s.length ≤ 1000 · s consists of digits and English letters.</p>""",
        "editorial": "Expand Around Center: for each index (and each adjacent pair), expand outward while characters match. Track the longest palindrome seen. O(n²) time, O(1) space. Manacher's algorithm achieves O(n).",
        "test_cases": [
            {"input": 's = "babad"', "expected": '"bab" or "aba"'},
            {"input": 's = "cbbd"', "expected": '"bb"'},
            {"input": 's = "racecar"', "expected": '"racecar"'},
        ],
        "snippets": {
            "python3": "class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        ",
            "javascript": "var longestPalindrome = function(s) {\n    \n};",
            "java": "class Solution {\n    public String longestPalindrome(String s) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    string longestPalindrome(string s) {\n        \n    }\n};",
            "c": 'char* longestPalindrome(char* s) { return ""; }',
            "typescript": "function longestPalindrome(s: string): string {\n    \n};",
            "golang": 'func longestPalindrome(s string) string {\n    \n}',
        }
    },
    {
        "id": "124", "slug": "binary-tree-maximum-path-sum", "title": "Binary Tree Maximum Path Sum", "difficulty": "Hard",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>A <strong>path</strong> in a binary tree is a sequence of nodes where adjacent nodes have an edge. A node can appear at most once. The path does not need to pass through the root.</p>
<p>Return the <em>maximum path sum</em> of any non-empty path.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: root = [1,2,3]  →  Output: 6  (path: 2→1→3)</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: root = [-10,9,20,null,null,15,7]  →  Output: 42  (path: 15→20→7)</pre>
<p><strong>Constraints:</strong> Nodes in [1, 3×10⁴] · −1000 ≤ Node.val ≤ 1000</p>""",
        "editorial": "Post-order DFS. At each node: left_gain = max(0, dfs(left)), right_gain = max(0, dfs(right)). Update ans = max(ans, node.val + left_gain + right_gain). Return node.val + max(left_gain, right_gain) to parent.",
        "test_cases": [
            {"input": "root = [1,2,3]", "expected": "6"},
            {"input": "root = [-10,9,20,null,null,15,7]", "expected": "42"},
            {"input": "root = [-3]", "expected": "-3"},
        ],
        "snippets": {
            "python3": "from typing import Optional\n\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val; self.left = left; self.right = right\n\nclass Solution:\n    def maxPathSum(self, root: Optional[TreeNode]) -> int:\n        ",
            "javascript": "var maxPathSum = function(root) {\n    \n};",
            "java": "class Solution {\n    public int maxPathSum(TreeNode root) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    int maxPathSum(TreeNode* root) {\n        \n    }\n};",
            "c": "int maxPathSum(struct TreeNode* root) { return 0; }",
            "typescript": "function maxPathSum(root: TreeNode | null): number {\n    \n};",
            "golang": "func maxPathSum(root *TreeNode) int {\n    \n}",
        }
    },
    {
        "id": "198", "slug": "house-robber", "title": "House Robber", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>You are a professional robber. Adjacent houses have alarms — rob two adjacent houses and the police are called.</p>
<p>Given <code>nums[i]</code> = money in house <code>i</code>, return the maximum money you can rob without triggering the alarm.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [1,2,3,1]  →  Output: 4  (house 1 + house 3)</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [2,7,9,3,1]  →  Output: 12  (house 1+3+5)</pre>
<p><strong>Constraints:</strong> 1 ≤ nums.length ≤ 100 · 0 ≤ nums[i] ≤ 400</p>""",
        "editorial": "DP: dp[i] = max(dp[i-1], dp[i-2]+nums[i]). Space-optimize: track two variables prev1 and prev2. At each step curr = max(prev1, prev2 + nums[i]). O(n) time, O(1) space.",
        "test_cases": [
            {"input": "nums = [1,2,3,1]", "expected": "4"},
            {"input": "nums = [2,7,9,3,1]", "expected": "12"},
            {"input": "nums = [1,2]", "expected": "2"},
        ],
        "snippets": {
            "python3": "from typing import List\n\nclass Solution:\n    def rob(self, nums: List[int]) -> int:\n        ",
            "javascript": "var rob = function(nums) {\n    \n};",
            "java": "class Solution {\n    public int rob(int[] nums) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        \n    }\n};",
            "c": "int rob(int* nums, int numsSize) { return 0; }",
            "typescript": "function rob(nums: number[]): number {\n    \n};",
            "golang": "func rob(nums []int) int {\n    \n}",
        }
    },
    {
        "id": "215", "slug": "kth-largest-element-in-an-array", "title": "Kth Largest Element in an Array", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>Given an integer array <code>nums</code> and an integer <code>k</code>, return the <code>kth</code> largest element in sorted order (not the kth distinct element).</p>
<p><strong>Follow-up:</strong> Can you solve it without sorting?</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [3,2,1,5,6,4], k = 2  →  Output: 5</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [3,2,3,1,2,4,5,5,6], k = 4  →  Output: 4</pre>
<p><strong>Constraints:</strong> 1 ≤ k ≤ nums.length ≤ 10⁵ · −10⁴ ≤ nums[i] ≤ 10⁴</p>""",
        "editorial": "QuickSelect (avg O(n)): Partition around pivot. If pivot position == n-k, return it. Recurse into correct half. Min-heap of size k is O(n log k) and simpler to implement.",
        "test_cases": [
            {"input": "nums = [3,2,1,5,6,4], k = 2", "expected": "5"},
            {"input": "nums = [3,2,3,1,2,4,5,5,6], k = 4", "expected": "4"},
            {"input": "nums = [1], k = 1", "expected": "1"},
        ],
        "snippets": {
            "python3": "from typing import List\n\nclass Solution:\n    def findKthLargest(self, nums: List[int], k: int) -> int:\n        ",
            "javascript": "var findKthLargest = function(nums, k) {\n    \n};",
            "java": "class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        \n    }\n}",
            "cpp": "class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        \n    }\n};",
            "c": "int findKthLargest(int* nums, int numsSize, int k) { return 0; }",
            "typescript": "function findKthLargest(nums: number[], k: number): number {\n    \n};",
            "golang": "func findKthLargest(nums []int, k int) int {\n    \n}",
        }
    },
    {
        "id": "297", "slug": "serialize-and-deserialize-binary-tree", "title": "Serialize and Deserialize Binary Tree", "difficulty": "Hard",
        "source": "LeetCode", "question_type": "coding", "default_lang": "python3",
        "content": """<p>Design an algorithm to serialize and deserialize a binary tree. Serialization converts the tree to a string; deserialization reconstructs the tree from that string.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: root = [1,2,3,null,null,4,5]
Output: [1,2,3,null,null,4,5]</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: root = []  →  Output: []</pre>
<p><strong>Constraints:</strong> Nodes in [0, 10⁴] · −1000 ≤ Node.val ≤ 1000</p>""",
        "editorial": "BFS level-order serialization: write 'null' for missing children, use comma separator. Deserialize by BFS, assign children from queue. Alternatively use preorder DFS with '#' for null.",
        "test_cases": [
            {"input": "root = [1,2,3,null,null,4,5]", "expected": "[1,2,3,null,null,4,5]"},
            {"input": "root = [1]", "expected": "[1]"},
            {"input": "root = []", "expected": "[]"},
        ],
        "snippets": {
            "python3": "class Codec:\n    def serialize(self, root):\n        \"\"\"Encodes tree to string. :rtype: str\"\"\"\n        \n    def deserialize(self, data):\n        \"\"\"Decodes string to tree. :rtype: TreeNode\"\"\"\n        \n# codec = Codec()\n# codec.deserialize(codec.serialize(root))",
            "javascript": "var serialize = function(root) {\n    \n};\nvar deserialize = function(data) {\n    \n};",
            "java": "public class Codec {\n    public String serialize(TreeNode root) { return \"\"; }\n    public TreeNode deserialize(String data) { return null; }\n}",
            "cpp": "class Codec {\npublic:\n    string serialize(TreeNode* root) { return \"\"; }\n    TreeNode* deserialize(string data) { return nullptr; }\n};",
            "c": "char* serialize(struct TreeNode* root) { return NULL; }\nstruct TreeNode* deserialize(char* data) { return NULL; }",
            "typescript": "function serialize(root: TreeNode | null): string {\n    \n};\nfunction deserialize(data: string): TreeNode | null {\n    \n};",
            "golang": "func serialize(root *TreeNode) string {\n    return \"\"\n}\nfunc deserialize(data string) *TreeNode {\n    return nil\n}",
        }
    },
]


# ─── SQL Pool (LeetCode Medium/Hard) ────────────────────────
SQL_POOL = [
    {
        "id": "176", "slug": "second-highest-salary", "title": "Second Highest Salary", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "sql", "default_lang": "sql",
        "content": """<p>Table: <code>Employee</code></p>
<pre>+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| salary      | int  |
+-------------+------+
id is the primary key.</pre>
<p>Write a SQL query to report the <strong>second highest salary</strong> from the Employee table. If there is no second highest salary, report <code>null</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>Employee:
| id | salary |
|----|--------|
|  1 |    100 |
|  2 |    200 |
|  3 |    300 |

Result:
| SecondHighestSalary |
|---------------------|
|                 200 |</pre>
<p><strong>Example 2:</strong></p>
<pre>Employee:
| id | salary |
|----|--------|
|  1 |    100 |

Result:
| SecondHighestSalary |
|---------------------|
|                null |</pre>""",
        "editorial": "Use IFNULL with a subquery: SELECT IFNULL((SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1), NULL) AS SecondHighestSalary. Or use DENSE_RANK() in a CTE.",
        "test_cases": [
            {
                "input": "Employee table:\n| id | salary |\n|----|--------|\n|  1 |    100 |\n|  2 |    200 |\n|  3 |    300 |",
                "expected": "| SecondHighestSalary |\n|---------------------|\n| 200                 |"
            },
            {
                "input": "Employee table:\n| id | salary |\n|----|--------|\n|  1 |    100 |",
                "expected": "| SecondHighestSalary |\n|---------------------|\n| null                |"
            },
        ],
        "snippets": {
            "sql": "-- Write your SQL query here\nSELECT\n    \nAS SecondHighestSalary;",
            "python3": "# Python + SQL (use sqlite3)\nimport sqlite3\n\n# Table: Employee(id, salary)\ndef second_highest_salary(con):\n    query = \"\"\"\n    SELECT ???\n    \"\"\"\n    return con.execute(query).fetchall()",
        }
    },
    {
        "id": "180", "slug": "consecutive-numbers", "title": "Consecutive Numbers", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "sql", "default_lang": "sql",
        "content": """<p>Table: <code>Logs</code></p>
<pre>+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| num         | varchar |
+-------------+---------+
id is the primary key (auto-incremented).</pre>
<p>Find all numbers that appear <strong>at least three times consecutively</strong>.</p>
<p><strong>Example:</strong></p>
<pre>Logs:
| id | num |
|----|-----|
|  1 |   1 |
|  2 |   1 |
|  3 |   1 |
|  4 |   2 |
|  5 |   1 |
|  6 |   2 |
|  7 |   2 |

Result:
| ConsecutiveNums |
|-----------------|
| 1               |</pre>""",
        "editorial": "Self-join on consecutive IDs: SELECT DISTINCT l1.Num AS ConsecutiveNums FROM Logs l1 JOIN Logs l2 ON l2.Id = l1.Id+1 JOIN Logs l3 ON l3.Id = l1.Id+2 WHERE l1.Num=l2.Num AND l2.Num=l3.Num. Or use LAG/LEAD window functions.",
        "test_cases": [
            {
                "input": "Logs table:\n| id | num |\n|----|-----|\n|  1 |   1 |\n|  2 |   1 |\n|  3 |   1 |\n|  4 |   2 |\n|  5 |   1 |\n|  6 |   2 |\n|  7 |   2 |",
                "expected": "| ConsecutiveNums |\n|-----------------|\n| 1               |"
            },
        ],
        "snippets": {
            "sql": "-- Write your SQL query here\nSELECT DISTINCT\n    \nAS ConsecutiveNums\nFROM Logs;",
            "python3": "# Python + SQL\nimport sqlite3\n\ndef consecutive_numbers(con):\n    query = \"\"\"\n    SELECT DISTINCT ???\n    \"\"\"\n    return con.execute(query).fetchall()",
        }
    },
    {
        "id": "185", "slug": "department-top-three-salaries", "title": "Department Top Three Salaries", "difficulty": "Hard",
        "source": "LeetCode", "question_type": "sql", "default_lang": "sql",
        "content": """<p>Tables: <code>Employee</code> and <code>Department</code></p>
<pre>Employee:
+-------------+---------+
| employeeId  | int     |
| name        | varchar |
| salary      | int     |
| departmentId| int     |
+-------------+---------+

Department:
+-------------+---------+
| id          | int     |
| name        | varchar |
+-------------+---------+</pre>
<p>A company considers its <strong>top three unique salaries</strong> per department as "High Earners". Write a query to find the employees in these brackets.</p>
<p><strong>Example:</strong></p>
<pre>Output:
| Department | Employee | Salary |
|------------|----------|--------|
| IT         | Max      |  90000 |
| IT         | Joe      |  85000 |
| IT         | Randy    |  85000 |
| Sales      | Henry    |  80000 |</pre>""",
        "editorial": "Use DENSE_RANK() partitioned by departmentId ordered by salary DESC. Then filter WHERE rnk <= 3. Join with Department table to get department name.",
        "test_cases": [
            {
                "input": "Employee: [(1,'Joe',85000,1),(2,'Henry',80000,2),(3,'Sam',60000,2),(4,'Max',90000,1),(5,'Janet',69000,1),(6,'Randy',85000,1)]\nDepartment: [(1,'IT'),(2,'Sales')]",
                "expected": "| Department | Employee | Salary |\n|------------|----------|--------|\n| IT         | Max      |  90000 |\n| IT         | Joe      |  85000 |\n| IT         | Randy    |  85000 |\n| Sales      | Henry    |  80000 |\n| Sales      | Sam      |  60000 |"
            },
        ],
        "snippets": {
            "sql": "-- Write your SQL query here\nSELECT\n    d.name AS Department,\n    e.name AS Employee,\n    e.salary AS Salary\nFROM Employee e\nJOIN Department d ON e.departmentId = d.id\nWHERE ???;",
            "python3": "import sqlite3\n\ndef department_top_three(con):\n    query = \"\"\"\n    SELECT ???\n    \"\"\"\n    return con.execute(query).fetchall()",
        }
    },
    {
        "id": "178", "slug": "rank-scores", "title": "Rank Scores", "difficulty": "Medium",
        "source": "LeetCode", "question_type": "sql", "default_lang": "sql",
        "content": """<p>Table: <code>Scores</code></p>
<pre>+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| score       | decimal |
+-------------+---------+
id is the primary key.</pre>
<p>Write a query to rank the scores. Ties share the same rank, and no gaps after a tie (use <strong>dense ranking</strong>).</p>
<p><strong>Example:</strong></p>
<pre>Input:
| id | score |
|----|-------|
|  1 |  3.50 |
|  2 |  3.65 |
|  3 |  4.00 |
|  4 |  3.85 |
|  5 |  4.00 |
|  6 |  3.65 |

Output:
| score | rank |
|-------|------|
|  4.00 |    1 |
|  4.00 |    1 |
|  3.85 |    2 |
|  3.65 |    3 |
|  3.65 |    3 |
|  3.50 |    4 |</pre>""",
        "editorial": "Use DENSE_RANK() OVER (ORDER BY score DESC) AS 'rank'. This assigns consecutive ranks without gaps. Alternative: correlated subquery counting distinct higher scores + 1.",
        "test_cases": [
            {
                "input": "Scores table:\n| id | score |\n|----|-------|\n|  1 |  3.50 |\n|  2 |  3.65 |\n|  3 |  4.00 |\n|  4 |  3.85 |",
                "expected": "| score | rank |\n|-------|------|\n|  4.00 |    1 |\n|  3.85 |    2 |\n|  3.65 |    3 |\n|  3.50 |    4 |"
            },
        ],
        "snippets": {
            "sql": "-- Write your SQL query here\nSELECT\n    score,\n    ??? AS 'rank'\nFROM Scores\nORDER BY score DESC;",
            "python3": "import sqlite3\n\ndef rank_scores(con):\n    query = \"\"\"\n    SELECT score, ??? AS rank\n    FROM Scores ORDER BY score DESC\n    \"\"\"\n    return con.execute(query).fetchall()",
        }
    },
]


# ─── ML Pool (GFG / conceptual Python) ──────────────────────
ML_POOL = [
    {
        "id": "gfg-ml-1", "slug": "gradient-descent-implementation", "title": "Implement Gradient Descent", "difficulty": "Medium",
        "source": "GFG", "question_type": "ml", "default_lang": "python3",
        "content": """<p>Implement <strong>Batch Gradient Descent</strong> from scratch to minimise Mean Squared Error for linear regression without using any ML libraries.</p>
<p>Your function should:</p>
<ul>
<li>Accept <code>X</code> (feature matrix, shape <code>n×d</code>), <code>y</code> (labels, shape <code>n×1</code>), <code>lr</code> (learning rate), <code>epochs</code> (iterations).</li>
<li>Initialise weights <code>w</code> to zeros.</li>
<li>At each epoch: compute predictions, compute MSE loss, compute gradient, update weights.</li>
<li>Return final weights <code>w</code> and loss history.</li>
</ul>
<p><strong>Key formulas:</strong></p>
<pre>ŷ = X @ w
MSE = (1/n) * ||ŷ - y||²
∇w = (2/n) * Xᵀ @ (ŷ - y)
w := w - lr * ∇w</pre>
<p><strong>Evaluation criteria:</strong> Correctness of gradient formula, convergence (loss should decrease), code clarity, vectorised NumPy operations.</p>""",
        "editorial": "The gradient of MSE w.r.t. w is (2/n) * X.T @ (X@w - y). Vectorized: one matrix multiply for predictions, one subtract, one matrix multiply for gradient. Use np.array for all operations. Check loss decreases each epoch — if it diverges, lr is too large.",
        "test_cases": [
            {
                "input": "X = [[1,1],[1,2],[1,3],[1,4]]\ny = [2, 4, 6, 8]  (y=2x)\nlr = 0.01, epochs = 1000",
                "expected": "Rubric:\n✓ Weights converge to ~[0, 2] after 1000 epochs\n✓ Loss decreases monotonically\n✓ Final MSE < 0.01\n✓ Vectorised NumPy (no Python for-loops over samples)"
            },
            {
                "input": "X = [[1,0],[1,1],[1,2]]\ny = [1, 3, 5]  (y=2x+1)\nlr = 0.05, epochs = 500",
                "expected": "Rubric:\n✓ Bias term in w[0] converges to ~1\n✓ Feature weight converges to ~2\n✓ Gradient formula uses X.T correctly"
            },
        ],
        "snippets": {
            "python3": "import numpy as np\nfrom typing import Tuple, List\n\ndef gradient_descent(\n    X: np.ndarray,\n    y: np.ndarray,\n    lr: float = 0.01,\n    epochs: int = 1000\n) -> Tuple[np.ndarray, List[float]]:\n    \"\"\"\n    Batch Gradient Descent for Linear Regression.\n    Returns: (weights, loss_history)\n    \"\"\"\n    n, d = X.shape\n    w = np.zeros(d)          # initialise weights\n    loss_history = []\n    \n    for _ in range(epochs):\n        # TODO: compute predictions\n        # TODO: compute MSE loss\n        # TODO: compute gradient\n        # TODO: update weights\n        pass\n    \n    return w, loss_history",
            "javascript": "// JavaScript implementation\nfunction gradientDescent(X, y, lr = 0.01, epochs = 1000) {\n    // X: 2D array [n][d], y: 1D array [n]\n    const n = X.length, d = X[0].length;\n    let w = new Array(d).fill(0);\n    const lossHistory = [];\n    \n    for (let ep = 0; ep < epochs; ep++) {\n        // TODO: matrix multiply X @ w\n        // TODO: compute MSE and gradient\n        // TODO: update w\n    }\n    return { weights: w, lossHistory };\n}",
        }
    },
    {
        "id": "gfg-ml-2", "slug": "knn-classifier", "title": "Implement K-Nearest Neighbours Classifier", "difficulty": "Medium",
        "source": "GFG", "question_type": "ml", "default_lang": "python3",
        "content": """<p>Implement a <strong>K-Nearest Neighbours (KNN) Classifier</strong> from scratch using NumPy. No sklearn allowed.</p>
<p>Your class should support:</p>
<ul>
<li><code>fit(X_train, y_train)</code> — stores training data.</li>
<li><code>predict(X_test, k)</code> — for each test sample, compute Euclidean distances to all training samples, find k nearest, return majority class.</li>
</ul>
<p><strong>Distance formula:</strong> <code>d(a,b) = sqrt(Σ(aᵢ-bᵢ)²)</code></p>
<p><strong>Evaluation:</strong> Correctness of distance computation, tie-breaking, vectorised operations, accuracy ≥ 90% on the provided Iris-like dataset.</p>""",
        "editorial": "Store X_train, y_train in fit(). In predict(): compute distance matrix (n_test × n_train) using broadcasting: dists = np.sqrt(((X_test[:,None,:] - X_train[None,:,:])**2).sum(axis=2)). Argsort each row, take k smallest, majority vote.",
        "test_cases": [
            {
                "input": "X_train = [[1,1],[2,2],[3,3],[6,6],[7,7],[8,8]]\ny_train = [0,   0,   0,   1,   1,   1  ]\nX_test  = [[2,2], [7,7]]\nk = 3",
                "expected": "Rubric:\n✓ predict([[2,2],[7,7]], k=3) → [0, 1]\n✓ Distance matrix computed correctly\n✓ Majority vote uses Counter or np.bincount\n✓ Works with any k ≤ n_train"
            },
            {
                "input": "Single-feature dataset:\nX_train = [[1],[3],[5],[7],[9]]\ny_train = [0, 0, 1, 1, 1]\nX_test  = [[4]], k=3",
                "expected": "Rubric:\n✓ Distances: |4-1|=3, |4-3|=1, |4-5|=1, ...\n✓ 3 nearest are [3,5,7] → labels [0,1,1] → predict 1"
            },
        ],
        "snippets": {
            "python3": "import numpy as np\nfrom collections import Counter\n\nclass KNNClassifier:\n    def fit(self, X_train: np.ndarray, y_train: np.ndarray) -> None:\n        \"\"\"Store training data.\"\"\"\n        # TODO\n        pass\n    \n    def predict(self, X_test: np.ndarray, k: int = 3) -> np.ndarray:\n        \"\"\"\n        Predict class labels for each sample in X_test.\n        Returns: np.ndarray of predicted labels.\n        \"\"\"\n        # TODO: compute all pairwise distances\n        # TODO: find k nearest neighbours\n        # TODO: majority vote\n        pass\n\n# knn = KNNClassifier()\n# knn.fit(X_train, y_train)\n# predictions = knn.predict(X_test, k=3)",
            "javascript": "class KNNClassifier {\n    fit(X_train, y_train) {\n        this.X_train = X_train;\n        this.y_train = y_train;\n    }\n    \n    predict(X_test, k = 3) {\n        // TODO: compute Euclidean distances\n        // TODO: find k nearest\n        // TODO: majority vote\n        return [];\n    }\n}",
        }
    },
    {
        "id": "gfg-ml-3", "slug": "decision-tree-gini", "title": "Decision Tree Split — Gini Impurity", "difficulty": "Hard",
        "source": "GFG", "question_type": "ml", "default_lang": "python3",
        "content": """<p>Implement the core splitting logic for a <strong>Decision Tree classifier</strong> using Gini Impurity as the criterion.</p>
<p>You need to implement:</p>
<ol>
<li><code>gini(labels)</code> — computes Gini impurity of a set of labels: <code>1 - Σpᵢ²</code></li>
<li><code>best_split(X, y)</code> — finds the feature and threshold that minimises the weighted Gini impurity after the split. Returns <code>(feature_idx, threshold)</code>.</li>
</ol>
<p><strong>Weighted Gini after split:</strong> <code>G = (n_left/n)*gini(y_left) + (n_right/n)*gini(y_right)</code></p>
<p><strong>Evaluation:</strong> Correct Gini formula, exhaustive feature/threshold search, correct weighted Gini calculation.</p>""",
        "editorial": "gini([0,0,1,1]) = 1 - (0.5² + 0.5²) = 0.5. For best_split: iterate every feature, sort unique values, try each midpoint as threshold, compute weighted gini of the two resulting partitions. Keep track of minimum weighted gini found.",
        "test_cases": [
            {
                "input": "labels = [0, 0, 0, 1, 1, 1]\ngini(labels) should return:",
                "expected": "Rubric:\n✓ gini([0,0,0,1,1,1]) = 0.5\n✓ gini([0,0,0,0]) = 0.0  (pure)\n✓ gini([0,1,2]) = 0.667 (uniform 3 classes)"
            },
            {
                "input": "X = [[2],[4],[6],[8]]\ny = [0, 0, 1, 1]\nbest_split(X, y) should return:",
                "expected": "Rubric:\n✓ Returns (feature_idx=0, threshold between 4 and 6, e.g. 5.0)\n✓ Weighted Gini at best split = 0.0\n✓ Correctly partitions: left=[2,4]→[0,0], right=[6,8]→[1,1]"
            },
        ],
        "snippets": {
            "python3": "import numpy as np\nfrom typing import Tuple\n\ndef gini(labels: np.ndarray) -> float:\n    \"\"\"\n    Compute Gini impurity: 1 - sum(p_i^2)\n    labels: 1D array of class labels\n    \"\"\"\n    # TODO\n    pass\n\ndef best_split(X: np.ndarray, y: np.ndarray) -> Tuple[int, float]:\n    \"\"\"\n    Find the best (feature_index, threshold) that minimises\n    weighted Gini impurity after the split.\n    Returns (feature_idx, threshold)\n    \"\"\"\n    n_samples, n_features = X.shape\n    best_gini = float('inf')\n    best_feature, best_threshold = 0, 0.0\n    \n    for feature_idx in range(n_features):\n        # TODO: try each unique threshold\n        # TODO: compute weighted gini\n        # TODO: update best\n        pass\n    \n    return best_feature, best_threshold",
            "javascript": "function gini(labels) {\n    // labels: array of class labels\n    // TODO: compute 1 - sum(p_i^2)\n}\n\nfunction bestSplit(X, y) {\n    // X: 2D array, y: 1D array\n    // TODO: find best (featureIdx, threshold)\n    return { featureIdx: 0, threshold: 0.0 };\n}",
        }
    },
]


# ─── React / Web Pool (GFG / JS fundamentals) ───────────────
REACT_POOL = [
    {
        "id": "gfg-web-1", "slug": "debounce-throttle", "title": "Implement debounce() and throttle()", "difficulty": "Medium",
        "source": "GFG", "question_type": "coding", "default_lang": "javascript",
        "content": """<p>Implement two utility functions commonly used in web development:</p>
<ol>
<li><strong>debounce(fn, delay)</strong> — Returns a new function that delays calling <code>fn</code> until after <code>delay</code> ms have elapsed since the <em>last</em> invocation. Cancels the previous timer on each new call.</li>
<li><strong>throttle(fn, limit)</strong> — Returns a new function that calls <code>fn</code> at most once per <code>limit</code> ms. Subsequent calls within the window are ignored.</li>
</ol>
<p><strong>Use case:</strong> debounce for search input (fire after user stops typing), throttle for scroll events (fire at most every 200ms).</p>
<p><strong>Example:</strong></p>
<pre>const debouncedFn = debounce(console.log, 300);
debouncedFn("a"); debouncedFn("b"); debouncedFn("c");
// Only "c" is logged after 300ms

const throttledFn = throttle(console.log, 200);
// At most 1 call per 200ms window</pre>""",
        "editorial": "debounce: store a timer ID. On each call, clearTimeout(timer) then setTimeout(() => fn(...args), delay). throttle: store lastTime=0. On each call, if Date.now() - lastTime >= limit, call fn and update lastTime.",
        "test_cases": [
            {
                "input": "Test debounce:\nconst log = [];\nconst db = debounce((x) => log.push(x), 100);\ndb(1); db(2); db(3);\n// Wait 150ms\n// Check log",
                "expected": "Rubric:\n✓ log = [3]  (only last call fires)\n✓ Previous timers are cancelled\n✓ Delay resets on each new call\n✓ 'this' context preserved if needed"
            },
            {
                "input": "Test throttle:\nconst log = [];\nconst th = throttle((x) => log.push(x), 100);\nth(1); th(2); th(3);\n// Immediately: log = ?\n// After 150ms, call th(4): log = ?",
                "expected": "Rubric:\n✓ log = [1] immediately (first call fires)\n✓ th(2), th(3) are dropped within window\n✓ After 150ms th(4) fires → log = [1, 4]\n✓ Consistent with leading-edge throttle"
            },
        ],
        "snippets": {
            "javascript": "/**\n * @param {Function} fn\n * @param {number} delay\n * @return {Function}\n */\nfunction debounce(fn, delay) {\n    let timer = null;\n    return function(...args) {\n        // TODO: cancel previous timer, set new one\n    };\n}\n\n/**\n * @param {Function} fn\n * @param {number} limit\n * @return {Function}\n */\nfunction throttle(fn, limit) {\n    let lastTime = 0;\n    return function(...args) {\n        // TODO: allow call only if limit ms have passed\n    };\n}\n\n// Test:\n// const debouncedSearch = debounce(fetchResults, 300);\n// const throttledScroll = throttle(updateUI, 200);",
            "typescript": "function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {\n    let timer: ReturnType<typeof setTimeout> | null = null;\n    return function(...args: Parameters<T>) {\n        // TODO\n    };\n}\n\nfunction throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {\n    let lastTime = 0;\n    return function(...args: Parameters<T>) {\n        // TODO\n    };\n}",
            "python3": "import time, threading\n\ndef debounce(fn, delay_ms):\n    \"\"\"Return a debounced version of fn (delay in ms).\"\"\"\n    timer = [None]\n    def wrapper(*args, **kwargs):\n        if timer[0]:\n            timer[0].cancel()\n        timer[0] = threading.Timer(delay_ms/1000, fn, args, kwargs)\n        timer[0].start()\n    return wrapper",
        }
    },
    {
        "id": "gfg-web-2", "slug": "promise-all-race", "title": "Implement Promise.all() and Promise.race()", "difficulty": "Hard",
        "source": "GFG", "question_type": "coding", "default_lang": "javascript",
        "content": """<p>Implement two Promise combinators from scratch:</p>
<ol>
<li><strong>myPromiseAll(promises)</strong> — Like <code>Promise.all</code>: resolves when all promises resolve (in order), rejects immediately on any rejection.</li>
<li><strong>myPromiseRace(promises)</strong> — Like <code>Promise.race</code>: resolves/rejects as soon as the first promise settles.</li>
</ol>
<p>You may use <code>new Promise()</code> internally, but not <code>Promise.all</code> or <code>Promise.race</code> directly.</p>
<p><strong>Example:</strong></p>
<pre>myPromiseAll([
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3)
]).then(vals => console.log(vals)); // [1, 2, 3]

myPromiseRace([
    new Promise(res => setTimeout(() => res("slow"), 100)),
    Promise.resolve("fast"),
]).then(v => console.log(v)); // "fast"</pre>""",
        "editorial": "myPromiseAll: create new Promise, track results array and resolvedCount. For each promise, when resolved store result[i] and if resolvedCount===n, call outer resolve(results). On any rejection, call outer reject immediately. myPromiseRace: wrap each promise with .then(resolve).catch(reject) — first to settle wins.",
        "test_cases": [
            {
                "input": "myPromiseAll([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])",
                "expected": "Rubric:\n✓ Resolves to [1, 2, 3] (preserving order)\n✓ All promises must complete before resolving\n✓ myPromiseAll([resolve(1), reject('err')]) → rejects with 'err'\n✓ Empty array resolves to []"
            },
            {
                "input": "const p1 = new Promise(r => setTimeout(() => r('slow'), 200));\nconst p2 = Promise.resolve('fast');\nmyPromiseRace([p1, p2])",
                "expected": "Rubric:\n✓ Resolves to 'fast' immediately\n✓ p1 settling later has no effect\n✓ If first to settle is rejection, race rejects\n✓ Cannot call resolve/reject more than once (guarded)"
            },
        ],
        "snippets": {
            "javascript": "/**\n * @param {Promise[]} promises\n * @return {Promise}\n */\nfunction myPromiseAll(promises) {\n    return new Promise((resolve, reject) => {\n        if (promises.length === 0) return resolve([]);\n        const results = new Array(promises.length);\n        let resolved = 0;\n        \n        promises.forEach((p, i) => {\n            // TODO: handle resolve and reject\n        });\n    });\n}\n\n/**\n * @param {Promise[]} promises\n * @return {Promise}\n */\nfunction myPromiseRace(promises) {\n    return new Promise((resolve, reject) => {\n        // TODO: first settled wins\n    });\n}\n\n// Test:\n// myPromiseAll([p1, p2, p3]).then(console.log).catch(console.error);",
            "typescript": "async function myPromiseAll<T>(promises: Promise<T>[]): Promise<T[]> {\n    // TODO\n    return [];\n}\n\nasync function myPromiseRace<T>(promises: Promise<T>[]): Promise<T> {\n    // TODO\n    return promises[0];\n}",
        }
    },
    {
        "id": "gfg-web-3", "slug": "flatten-deep", "title": "Deep Flatten Array & Object", "difficulty": "Medium",
        "source": "GFG", "question_type": "coding", "default_lang": "javascript",
        "content": """<p>Implement two utility functions without using built-in <code>Array.flat()</code>:</p>
<ol>
<li><strong>flattenArray(arr, depth=Infinity)</strong> — Deeply flatten a nested array to the given depth.</li>
<li><strong>flattenObject(obj, prefix="")</strong> — Flatten a nested object into dot-notation keys.</li>
</ol>
<p><strong>Examples:</strong></p>
<pre>flattenArray([1, [2, [3, [4]]]]);
// → [1, 2, 3, 4]

flattenArray([1, [2, [3]]], 1);
// → [1, 2, [3]]

flattenObject({ a: { b: { c: 1 }, d: 2 }, e: 3 });
// → { "a.b.c": 1, "a.d": 2, "e": 3 }</pre>""",
        "editorial": "flattenArray: recursively reduce: if element is array and depth>0, recurse with depth-1; else push element. Or iteratively use stack with depth tracking. flattenObject: iterate keys; if value is plain object and not null, recurse with prefix+key+'.'; else assign to result[prefix+key].",
        "test_cases": [
            {
                "input": "flattenArray([1, [2, [3, [4, [5]]]]])",
                "expected": "Rubric:\n✓ Returns [1, 2, 3, 4, 5]\n✓ flattenArray([1,[2,[3]]], 1) → [1, 2, [3]]\n✓ flattenArray([]) → []\n✓ Handles mixed types: [1, 'a', [true, null]] → [1,'a',true,null]"
            },
            {
                "input": 'flattenObject({ a: { b: { c: 42 }, d: [1,2] }, e: "hello" })',
                "expected": 'Rubric:\n✓ Result = {"a.b.c": 42, "a.d": [1,2], "e": "hello"}\n✓ Arrays treated as leaf values (not recursed)\n✓ flattenObject({}) → {}\n✓ prefix="" by default, no leading dot'
            },
        ],
        "snippets": {
            "javascript": "/**\n * @param {any[]} arr\n * @param {number} depth\n * @return {any[]}\n */\nfunction flattenArray(arr, depth = Infinity) {\n    // TODO: recursively flatten\n}\n\n/**\n * @param {Object} obj\n * @param {string} prefix\n * @return {Object}\n */\nfunction flattenObject(obj, prefix = '') {\n    const result = {};\n    // TODO: iterate keys, recurse on nested objects\n    return result;\n}\n\n// Tests:\n// console.log(flattenArray([1,[2,[3]]]))         // [1,2,3]\n// console.log(flattenObject({a:{b:1},c:2}))      // {'a.b':1,'c':2}",
            "python3": "from typing import Any\n\ndef flatten_array(arr: list, depth: int = float('inf')) -> list:\n    \"\"\"Flatten nested list to given depth.\"\"\"\n    result = []\n    # TODO\n    return result\n\ndef flatten_object(obj: dict, prefix: str = '') -> dict:\n    \"\"\"Flatten nested dict to dot-notation keys.\"\"\"\n    result = {}\n    # TODO\n    return result",
            "typescript": "function flattenArray(arr: any[], depth: number = Infinity): any[] {\n    // TODO\n    return [];\n}\n\nfunction flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, any> {\n    const result: Record<string, any> = {};\n    // TODO\n    return result;\n}",
        }
    },
]


# ─── Domain Router ───────────────────────────────────────────
DOMAIN_POOLS = {
    "dsa":   DSA_POOL,
    "sql":   SQL_POOL,
    "ml":    ML_POOL,
    "react": REACT_POOL,
}

# Backwards compatibility alias
PROBLEM_POOL = DSA_POOL
