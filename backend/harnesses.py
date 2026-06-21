# ============================================================
# NEXUS — Real Code Execution Harnesses
# Each harness wraps user code in a test driver that:
#   1. Calls the function/class with exact test inputs
#   2. Prints stdout that EXACTLY matches the expected string
# {{USER_CODE}} is replaced with the user's submitted code.
# Sending cout<<"antigravity" WILL fail — the harness expects
# specific structured output from the function under test.
# ============================================================

# Language → Piston API runtime mapping
PISTON_LANGS = {
    'python3':    {'language': 'python',     'version': '3.10.0'},
    'javascript': {'language': 'javascript', 'version': '18.15.0'},
    'java':       {'language': 'java',       'version': '15.0.2'},
    'cpp':        {'language': 'c++',        'version': '10.2.0'},
    'c':          {'language': 'c',          'version': '10.2.0'},
    'typescript': {'language': 'typescript', 'version': '5.0.3'},
    'golang':     {'language': 'go',         'version': '1.16.2'},
}

# ─────────────────────────────────────────────────────────────
# DSA Harnesses
# ─────────────────────────────────────────────────────────────
HARNESSES = {

    # ── LRU Cache ──────────────────────────────────────────────
    'lru-cache': {
        'python3': {
            'code': r'''
{{USER_CODE}}

import json

def run_ops(capacity, ops, args):
    obj = None
    results = []
    for op, arg in zip(ops, args):
        if   op == "LRUCache": obj = LRUCache(*arg); results.append(None)
        elif op == "put":      obj.put(*arg);        results.append(None)
        elif op == "get":      results.append(obj.get(*arg))
    return results

print(json.dumps(run_ops(2,
    ["LRUCache","put","put","get","put","get","put","get","get","get"],
    [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]])))

print(json.dumps(run_ops(1,
    ["LRUCache","put","get"],
    [[1],[2,1],[2]])))
''',
            'expected': '[null, null, null, 1, null, -1, null, -1, 3, 4]\n[null, null, 1]',
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}

function runOps(ops, args) {
    let obj = null, results = [];
    for (let i = 0; i < ops.length; i++) {
        if      (ops[i]==="LRUCache") { obj=new LRUCache(...args[i]); results.push(null); }
        else if (ops[i]==="put")      { obj.put(...args[i]);          results.push(null); }
        else if (ops[i]==="get")      { results.push(obj.get(...args[i])); }
    }
    return results;
}

console.log(JSON.stringify(runOps(
    ["LRUCache","put","put","get","put","get","put","get","get","get"],
    [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]])));

console.log(JSON.stringify(runOps(
    ["LRUCache","put","get"],
    [[1],[2,1],[2]])));
''',
            'expected': '[null,null,null,1,null,-1,null,-1,3,4]\n[null,null,1]',
        },
        'cpp': {
            'code': r'''
#include <bits/stdc++.h>
using namespace std;

{{USER_CODE}}

int main(){
    {
        LRUCache obj(2);
        obj.put(1,1); obj.put(2,2);
        cout << obj.get(1); obj.put(3,3);
        cout << " " << obj.get(2); obj.put(4,4);
        cout << " " << obj.get(1);
        cout << " " << obj.get(3);
        cout << " " << obj.get(4) << "\n";
    }
    {
        LRUCache obj(1);
        obj.put(2,1);
        cout << obj.get(2) << "\n";
    }
    return 0;
}
''',
            'expected': '1 -1 -1 3 4\n1',
        },
        'java': {
            'code': r'''
import java.util.*;
{{USER_CODE}}

class Main {
    public static void main(String[] args) {
        LRUCache obj = new LRUCache(2);
        obj.put(1,1); obj.put(2,2);
        System.out.print(obj.get(1)+" ");
        obj.put(3,3);
        System.out.print(obj.get(2)+" ");
        obj.put(4,4);
        System.out.print(obj.get(1)+" ");
        System.out.print(obj.get(3)+" ");
        System.out.println(obj.get(4));
    }
}
''',
            'expected': '1 -1 -1 3 4',
        },
    },

    # ── Merge Intervals ────────────────────────────────────────
    'merge-intervals': {
        'python3': {
            'code': r'''
{{USER_CODE}}
import json
s = Solution()
print(json.dumps(s.merge([[1,3],[2,6],[8,10],[15,18]])))
print(json.dumps(s.merge([[1,4],[4,5]])))
print(json.dumps(s.merge([[1,4],[0,4]])))
''',
            'expected': '[[1, 6], [8, 10], [15, 18]]\n[[1, 5]]\n[[0, 4]]',
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}
console.log(JSON.stringify(merge([[1,3],[2,6],[8,10],[15,18]])));
console.log(JSON.stringify(merge([[1,4],[4,5]])));
''',
            'expected': '[[1,6],[8,10],[15,18]]\n[[1,5]]',
        },
        'cpp': {
            'code': r'''
#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main(){
    Solution s;
    auto pr=[](vector<vector<int>>& r){
        for(auto& v:r) cout<<"["<<v[0]<<","<<v[1]<<"]"; cout<<"\n";
    };
    auto r=s.merge({{1,3},{2,6},{8,10},{15,18}}); pr(r);
    auto r2=s.merge({{1,4},{4,5}}); pr(r2);
}
''',
            'expected': '[1,6][8,10][15,18]\n[1,5]',
        },
        'java': {
            'code': r'''
import java.util.*;
{{USER_CODE}}
class Main {
    public static void main(String[] args){
        Solution s = new Solution();
        int[][] r = s.merge(new int[][]{{1,3},{2,6},{8,10},{15,18}});
        StringBuilder sb = new StringBuilder();
        for(int[] v:r) sb.append("[").append(v[0]).append(",").append(v[1]).append("]");
        System.out.println(sb);
    }
}
''',
            'expected': '[1,6][8,10][15,18]',
        },
    },

    # ── Coin Change ────────────────────────────────────────────
    'coin-change': {
        'python3': {
            'code': r'''
{{USER_CODE}}
s = Solution()
print(s.coinChange([1,5,11], 11))
print(s.coinChange([1,5,11], 15))
print(s.coinChange([2], 3))
print(s.coinChange([1,2,5], 11))
''',
            'expected': '1\n3\n-1\n3',
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}
console.log(coinChange([1,5,11], 11));
console.log(coinChange([1,5,11], 15));
console.log(coinChange([2], 3));
''',
            'expected': '1\n3\n-1',
        },
        'cpp': {
            'code': r'''
#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main(){
    Solution s;
    cout<<s.coinChange({1,5,11},11)<<"\n";
    cout<<s.coinChange({1,5,11},15)<<"\n";
    cout<<s.coinChange({2},3)<<"\n";
}
''',
            'expected': '1\n3\n-1',
        },
        'java': {
            'code': r'''
import java.util.*;
{{USER_CODE}}
class Main {
    public static void main(String[] args){
        Solution s = new Solution();
        System.out.println(s.coinChange(new int[]{1,5,11},11));
        System.out.println(s.coinChange(new int[]{1,5,11},15));
        System.out.println(s.coinChange(new int[]{2},3));
    }
}
''',
            'expected': '1\n3\n-1',
        },
        'golang': {
            'code': r'''
package main
import "fmt"
{{USER_CODE}}
func main(){
    fmt.Println(coinChange([]int{1,5,11},11))
    fmt.Println(coinChange([]int{1,5,11},15))
    fmt.Println(coinChange([]int{2},3))
}
''',
            'expected': '1\n3\n-1',
        },
    },

    # ── Trapping Rain Water ────────────────────────────────────
    'trapping-rain-water': {
        'python3': {
            'code': r'''
{{USER_CODE}}
s = Solution()
print(s.trap([0,1,0,2,1,0,1,3,2,1,2,1]))
print(s.trap([4,2,0,3,2,5]))
print(s.trap([3,0,2,0,4]))
''',
            'expected': '6\n9\n7',
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}
console.log(trap([0,1,0,2,1,0,1,3,2,1,2,1]));
console.log(trap([4,2,0,3,2,5]));
''',
            'expected': '6\n9',
        },
        'cpp': {
            'code': r'''
#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main(){
    Solution s;
    cout<<s.trap({0,1,0,2,1,0,1,3,2,1,2,1})<<"\n";
    cout<<s.trap({4,2,0,3,2,5})<<"\n";
}
''',
            'expected': '6\n9',
        },
    },

    # ── Number of Islands ──────────────────────────────────────
    'number-of-islands': {
        'python3': {
            'code': r'''
{{USER_CODE}}
s = Solution()
import copy
g1=[["1","1","0"],["0","1","0"],["0","0","1"]]
g2=[["1","1","1"],["0","1","0"],["1","1","1"]]
print(s.numIslands(copy.deepcopy(g1)))
print(s.numIslands(copy.deepcopy(g2)))
''',
            'expected': '2\n1',
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}
console.log(numIslands([["1","1","0"],["0","1","0"],["0","0","1"]]));
console.log(numIslands([["1","1","1"],["0","1","0"],["1","1","1"]]));
''',
            'expected': '2\n1',
        },
        'cpp': {
            'code': r'''
#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main(){
    Solution s;
    vector<vector<char>> g1={{'1','1','0'},{'0','1','0'},{'0','0','1'}};
    cout<<s.numIslands(g1)<<"\n";
}
''',
            'expected': '2',
        },
    },

    # ── Minimum Window Substring ───────────────────────────────
    'minimum-window-substring': {
        'python3': {
            'code': r'''
{{USER_CODE}}
s = Solution()
print(repr(s.minWindow("ADOBECODEBANC","ABC")))
print(repr(s.minWindow("a","aa")))
print(repr(s.minWindow("aa","aa")))
''',
            'expected': "'BANC'\n''\n'aa'",
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}
console.log(minWindow("ADOBECODEBANC","ABC"));
console.log(minWindow("a","aa") || "(empty)");
''',
            'expected': 'BANC\n(empty)',
        },
    },

    # ── Top K Frequent Elements ────────────────────────────────
    'top-k-frequent-elements': {
        'python3': {
            'code': r'''
{{USER_CODE}}
s = Solution()
print(sorted(s.topKFrequent([1,1,1,2,2,3], 2)))
print(sorted(s.topKFrequent([1], 1)))
''',
            'expected': '[1, 2]\n[1]',
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}
console.log(JSON.stringify(topKFrequent([1,1,1,2,2,3],2).sort((a,b)=>a-b)));
console.log(JSON.stringify(topKFrequent([1],1)));
''',
            'expected': '[1,2]\n[1]',
        },
    },

    # ── Longest Palindromic Substring ──────────────────────────
    'longest-palindromic-substring': {
        'python3': {
            'code': r'''
{{USER_CODE}}
s = Solution()
r1 = s.longestPalindrome("babad")
r2 = s.longestPalindrome("cbbd")
r3 = s.longestPalindrome("racecar")
print("OK" if r1 in ("bab","aba") else "FAIL:"+r1)
print("OK" if r2 == "bb" else "FAIL:"+r2)
print("OK" if r3 == "racecar" else "FAIL:"+r3)
''',
            'expected': 'OK\nOK\nOK',
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}
const r1 = longestPalindrome("babad");
console.log((r1==="bab"||r1==="aba") ? "OK" : "FAIL:"+r1);
console.log(longestPalindrome("cbbd")==="bb" ? "OK" : "FAIL");
''',
            'expected': 'OK\nOK',
        },
    },

    # ── House Robber ───────────────────────────────────────────
    'house-robber': {
        'python3': {
            'code': r'''
{{USER_CODE}}
s = Solution()
print(s.rob([1,2,3,1]))
print(s.rob([2,7,9,3,1]))
print(s.rob([1,2]))
''',
            'expected': '4\n12\n2',
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}
console.log(rob([1,2,3,1]));
console.log(rob([2,7,9,3,1]));
console.log(rob([1,2]));
''',
            'expected': '4\n12\n2',
        },
        'cpp': {
            'code': r'''
#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main(){
    Solution s;
    cout<<s.rob({1,2,3,1})<<"\n";
    cout<<s.rob({2,7,9,3,1})<<"\n";
    cout<<s.rob({1,2})<<"\n";
}
''',
            'expected': '4\n12\n2',
        },
        'java': {
            'code': r'''
import java.util.*;
{{USER_CODE}}
class Main {
    public static void main(String[] args){
        Solution s = new Solution();
        System.out.println(s.rob(new int[]{1,2,3,1}));
        System.out.println(s.rob(new int[]{2,7,9,3,1}));
        System.out.println(s.rob(new int[]{1,2}));
    }
}
''',
            'expected': '4\n12\n2',
        },
    },

    # ── Kth Largest Element ────────────────────────────────────
    'kth-largest-element-in-an-array': {
        'python3': {
            'code': r'''
{{USER_CODE}}
s = Solution()
print(s.findKthLargest([3,2,1,5,6,4], 2))
print(s.findKthLargest([3,2,3,1,2,4,5,5,6], 4))
print(s.findKthLargest([1], 1))
''',
            'expected': '5\n4\n1',
        },
        'javascript': {
            'code': r'''
{{USER_CODE}}
console.log(findKthLargest([3,2,1,5,6,4],2));
console.log(findKthLargest([3,2,3,1,2,4,5,5,6],4));
''',
            'expected': '5\n4',
        },
        'cpp': {
            'code': r'''
#include <bits/stdc++.h>
using namespace std;
{{USER_CODE}}
int main(){
    Solution s;
    cout<<s.findKthLargest({3,2,1,5,6,4},2)<<"\n";
    cout<<s.findKthLargest({3,2,3,1,2,4,5,5,6},4)<<"\n";
}
''',
            'expected': '5\n4',
        },
    },

    # ── Binary Tree Maximum Path Sum ───────────────────────────
    'binary-tree-maximum-path-sum': {
        'python3': {
            'code': r'''
{{USER_CODE}}
from collections import deque

def make_tree(arr):
    if not arr: return None
    root = TreeNode(arr[0])
    q = deque([root]); i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i]); q.append(node.right)
        i += 1
    return root

s = Solution()
print(s.maxPathSum(make_tree([1,2,3])))
print(s.maxPathSum(make_tree([-10,9,20,None,None,15,7])))
print(s.maxPathSum(make_tree([-3])))
''',
            'expected': '6\n42\n-3',
        },
    },

    # ── Serialize / Deserialize Binary Tree ────────────────────
    'serialize-and-deserialize-binary-tree': {
        'python3': {
            'code': r'''
{{USER_CODE}}
from collections import deque

def make_tree(arr):
    if not arr: return None
    root = TreeNode(arr[0])
    q = deque([root]); i = 1
    while q and i < len(arr):
        node = q.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i]); q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i]); q.append(node.right)
        i += 1
    return root

def tree_to_list(root):
    if not root: return []
    res, q = [], deque([root])
    while q:
        node = q.popleft()
        if node: res.append(node.val); q.append(node.left); q.append(node.right)
        else: res.append(None)
    while res and res[-1] is None: res.pop()
    return res

import json
c = Codec()
t1 = make_tree([1,2,3,None,None,4,5])
print(json.dumps(tree_to_list(c.deserialize(c.serialize(t1)))))
t2 = make_tree([])
print(json.dumps(tree_to_list(c.deserialize(c.serialize(t2)))))
''',
            'expected': '[1, 2, 3, null, null, 4, 5]\n[]',
        },
    },

    # ─── SQL Problems — wrapped as Python + sqlite3 ────────────
    # For SQL, {{USER_CODE}} is the raw SQL query string
    'second-highest-salary': {
        'python3': {   # language key = python3, but it's the SQL wrapped in Python
            'code': r'''
import sqlite3, json

def run_sql(rows, query):
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE Employee (id INTEGER PRIMARY KEY, salary INTEGER)")
    conn.executemany("INSERT INTO Employee VALUES (?,?)", rows)
    try:
        cur = conn.execute(query)
        res = cur.fetchone()
        return res[0] if res else None
    except Exception as e:
        return str(e)

q = """
{{USER_CODE}}
"""

print(json.dumps(run_sql([(1,100),(2,200),(3,300)], q)))
print(json.dumps(run_sql([(1,100)], q)))
''',
            'expected': '200\nnull',
        },
    },

    'consecutive-numbers': {
        'python3': {
            'code': r'''
import sqlite3, json

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE Logs (id INTEGER PRIMARY KEY AUTOINCREMENT, num INTEGER)")
conn.executemany("INSERT INTO Logs(num) VALUES (?)", [(1,),(1,),(1,),(2,),(1,),(2,),(2,)])

q = """{{USER_CODE}}"""
rows = conn.execute(q).fetchall()
print(json.dumps(sorted(set(r[0] for r in rows))))
''',
            'expected': '[1]',
        },
    },

    'rank-scores': {
        'python3': {
            'code': r'''
import sqlite3, json

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE Scores (id INTEGER PRIMARY KEY, score REAL)")
conn.executemany("INSERT INTO Scores VALUES (?,?)", [(1,3.5),(2,3.65),(3,4.0),(4,3.85)])

q = """{{USER_CODE}}"""
rows = conn.execute(q).fetchall()
print(json.dumps([[round(r[0],2), r[1]] for r in rows]))
''',
            'expected': '[[4.0, 1], [3.85, 2], [3.65, 3], [3.5, 4]]',
        },
    },

    'department-top-three-salaries': {
        'python3': {
            'code': r'''
import sqlite3, json

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE Employee (id INT, name TEXT, salary INT, departmentId INT)")
conn.execute("CREATE TABLE Department (id INT, name TEXT)")
conn.executemany("INSERT INTO Employee VALUES (?,?,?,?)",
    [(1,"Joe",85000,1),(2,"Henry",80000,2),(3,"Sam",60000,2),
     (4,"Max",90000,1),(5,"Janet",69000,1),(6,"Randy",85000,1)])
conn.executemany("INSERT INTO Department VALUES (?,?)", [(1,"IT"),(2,"Sales")])

q = """{{USER_CODE}}"""
rows = conn.execute(q).fetchall()
print(json.dumps([[r[0],r[1],r[2]] for r in rows]))
''',
            'expected': '[["IT", "Max", 90000], ["IT", "Joe", 85000], ["IT", "Randy", 85000], ["Sales", "Henry", 80000], ["Sales", "Sam", 60000]]',
        },
    },

    # ─── React/Web Problems ────────────────────────────────────
    'debounce-throttle': {
        'javascript': {
            'code': r'''
{{USER_CODE}}

// Test 1: throttle — first call fires, subsequent blocked in window
const res1 = [];
const th = throttle((x) => res1.push(x), 500);
th(1); th(2); th(3);
console.log(JSON.stringify(res1));  // [1]

// Test 2: debounce — no call fires synchronously
const res2 = [];
const db = debounce((x) => res2.push(x), 500);
db(10); db(20); db(30);
console.log(JSON.stringify(res2));  // []  (timer not yet fired)
console.log("types-ok:" + (typeof debounce === "function" && typeof throttle === "function"));
''',
            'expected': '[1]\n[]\ntypes-ok:true',
        },
        'python3': {
            'code': r'''
{{USER_CODE}}

# Test debounce object exists and is callable
import threading
results = []
db = debounce(lambda x: results.append(x), 0.1)
th = throttle(lambda x: results.append(x), 0.1)
print("both-callable:" + str(callable(db) and callable(th)))
''',
            'expected': 'both-callable:True',
        },
    },

    'promise-all-race': {
        'javascript': {
            'code': r'''
{{USER_CODE}}

async function main() {
    // Test myPromiseAll resolves in order
    const r1 = await myPromiseAll([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
    ]);
    console.log(JSON.stringify(r1));  // [1,2,3]

    // Test empty array
    const r2 = await myPromiseAll([]);
    console.log(JSON.stringify(r2));  // []

    // Test myPromiseRace takes the fastest
    const r3 = await myPromiseRace([
        new Promise(res => setTimeout(() => res("slow"), 200)),
        Promise.resolve("fast"),
    ]);
    console.log(r3);  // fast
}
main().catch(e => console.log("ERROR:"+e));
''',
            'expected': '[1,2,3]\n[]\nfast',
        },
    },

    'flatten-deep': {
        'javascript': {
            'code': r'''
{{USER_CODE}}

console.log(JSON.stringify(flattenArray([1,[2,[3,[4]]]])));
console.log(JSON.stringify(flattenArray([1,[2,[3]]],1)));
console.log(JSON.stringify(flattenArray([])));
console.log(JSON.stringify(flattenObject({a:{b:{c:42}},e:"hello"})));
console.log(JSON.stringify(flattenObject({})));
''',
            'expected': '[1,2,3,4]\n[1,2,[3]]\n[]\n{"a.b.c":42,"e":"hello"}\n{}',
        },
        'python3': {
            'code': r'''
{{USER_CODE}}

import json
print(json.dumps(flatten_array([1,[2,[3,[4]]]])))
print(json.dumps(flatten_array([1,[2,[3]]],1)))
print(json.dumps(flatten_object({"a":{"b":{"c":42}},"e":"hello"})))
''',
            'expected': '[1, 2, 3, 4]\n[1, 2, [3]]\n{"a.b.c": 42, "e": "hello"}',
        },
    },

    # ─── ML Problems — validate structure, not exact output ────
    'gradient-descent-implementation': {
        'python3': {
            'code': r'''
import numpy as np
{{USER_CODE}}

# Test: linear y=2x
X = np.array([[1,0],[1,1],[1,2],[1,3],[1,4]], dtype=float)
y = np.array([0,2,4,6,8], dtype=float)
w, losses = gradient_descent(X, y, lr=0.01, epochs=2000)

print("converged:" + str(losses[-1] < 0.5))
print("decreasing:" + str(losses[0] > losses[-1]))
print("weight-shape:" + str(w.shape[0]))
print("loss-returned:" + str(len(losses) == 2000))
''',
            'expected': 'converged:True\ndecreasing:True\nweight-shape:2\nloss-returned:True',
        },
    },

    'knn-classifier': {
        'python3': {
            'code': r'''
import numpy as np
{{USER_CODE}}

X_train = np.array([[1,1],[2,2],[3,3],[6,6],[7,7],[8,8]], dtype=float)
y_train = np.array([0,0,0,1,1,1])
X_test  = np.array([[2,2],[7,7]], dtype=float)

knn = KNNClassifier()
knn.fit(X_train, y_train)
preds = knn.predict(X_test, k=3)
print("pred0:" + str(preds[0]))
print("pred1:" + str(preds[1]))

X_test2 = np.array([[4.5,4.5]], dtype=float)
p2 = knn.predict(X_test2, k=3)
print("boundary-ok:" + str(p2[0] in (0,1)))
''',
            'expected': 'pred0:0\npred1:1\nboundary-ok:True',
        },
    },

    'decision-tree-gini': {
        'python3': {
            'code': r'''
import numpy as np
{{USER_CODE}}

print("gini-pure:"    + str(round(gini(np.array([0,0,0,0])), 4)))
print("gini-half:"    + str(round(gini(np.array([0,0,1,1])), 4)))
print("gini-uniform:" + str(round(gini(np.array([0,1,2])), 4)))

X = np.array([[2],[4],[6],[8]], dtype=float)
y = np.array([0,0,1,1])
fi, th = best_split(X, y)
left  = y[X[:,fi] <= th]
right = y[X[:,fi] >  th]
wg = (len(left)/len(y))*gini(left) + (len(right)/len(y))*gini(right)
print("perfect-split:" + str(round(wg, 4) == 0.0))
''',
            'expected': 'gini-pure:0.0\ngini-half:0.5\ngini-uniform:0.6667\nperfect-split:True',
        },
    },
}
