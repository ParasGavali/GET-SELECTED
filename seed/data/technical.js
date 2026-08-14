// Technical questions. Every question is original, with a verified answer and explanation.
const q = (topic, text, options, correctOption, explanation, difficulty = 'medium', estimatedTime = 60) => ({
  topic, text, options, correctOption, explanation, difficulty, estimatedTime,
});

module.exports.technical = [
  // DBMS
  q('dbms', 'Which of the following is a DBMS?', ['Linux', 'MySQL', 'HTML', 'TCP/IP'], 1, 'MySQL is a relational database management system.', 'easy', 40),
  q('dbms', 'Which key uniquely identifies each row in a table?', ['Foreign key', 'Primary key', 'Candidate key', 'Unique index'], 1, 'A primary key uniquely identifies each record.', 'easy', 40),
  q('dbms', 'In normalization, 3NF removes which of the following?', ['Duplicate rows', 'Transitive dependencies', 'Foreign keys', 'Indexes'], 1, '3NF removes transitive (non-key) dependencies.', 'medium', 60),
  q('dbms', 'ACID in databases stands for?', ['Atomicity, Consistency, Isolation, Durability', 'Availability, Consistency, Integrity, Durability', 'Atomicity, Concurrency, Integrity, Data', 'Accuracy, Consistency, Isolation, Data'], 0, 'ACID = Atomicity, Consistency, Isolation, Durability.', 'medium', 50),
  q('dbms', 'A transaction that executes fully or not at all satisfies which property?', ['Atomicity', 'Consistency', 'Isolation', 'Durability'], 0, 'Atomicity guarantees all-or-nothing execution.', 'easy', 45),

  // Operating Systems
  q('operating-systems', 'Which scheduling algorithm gives the shortest average waiting time?', ['FIFO', 'Shortest Job First', 'Round Robin', 'Random'], 1, 'SJF minimizes average waiting time (non-preemptive).', 'medium', 55),
  q('operating-systems', 'The main function of an operating system is?', ['Compile programs', 'Manage hardware and software resources', 'Browse the internet', 'Store files only'], 1, 'The OS manages resources and provides services to applications.', 'easy', 40),
  q('operating-systems', 'Which of the following is an example of an operating system?', ['Google Chrome', 'Windows 11', 'MS Word', 'Python'], 1, 'Windows 11 is an operating system.', 'easy', 35),
  q('operating-systems', 'Virtual memory is implemented using?', ['Registers', 'Paging / swapping between RAM and disk', 'Cache only', 'BIOS'], 1, 'Virtual memory uses paging to swap data between RAM and disk.', 'medium', 55),
  q('operating-systems', 'Round Robin scheduling is especially suited for?', ['Batch systems', 'Time-sharing systems', 'Real-time embedded only', 'Single-process systems'], 1, 'Round Robin provides fairness for interactive time-sharing systems.', 'medium', 55),

  // Computer Networks
  q('computer-networks', 'Which layer of the OSI model routes packets across networks?', ['Physical', 'Data Link', 'Network', 'Transport'], 2, 'The Network layer (Layer 3) handles routing.', 'medium', 50),
  q('computer-networks', 'HTTP operates on which port by default?', ['21', '25', '80', '443'], 2, 'HTTP uses port 80 (HTTPS uses 443).', 'easy', 35),
  q('computer-networks', 'TCP is a ___ protocol.', ['Connectionless', 'Connection-oriented', 'Broadcast', 'Simple'], 1, 'TCP establishes a connection before transferring data.', 'easy', 40),
  q('computer-networks', 'Which protocol converts a domain name to an IP address?', ['HTTP', 'DNS', 'FTP', 'SMTP'], 1, 'DNS resolves domain names to IP addresses.', 'easy', 40),
  q('computer-networks', 'In the IP address 192.168.1.10, the network part for a /24 subnet is?', ['192.168.1', '168.1.10', '192.168', '1.10'], 0, 'With a /24 mask, the first 3 octets identify the network.', 'medium', 55),

  // OOP
  q('oop', 'Which OOP principle hides implementation details?', ['Inheritance', 'Encapsulation', 'Polymorphism', 'Abstraction'], 1, 'Encapsulation hides internal state behind an interface.', 'easy', 40),
  q('oop', 'A class can inherit from another class. This is called?', ['Abstraction', 'Inheritance', 'Encapsulation', 'Overloading'], 1, 'Inheritance lets a class derive from another class.', 'easy', 35),
  q('oop', 'Which of the following is NOT a feature of OOP?', ['Polymorphism', 'Inheritance', 'Encapsulation', 'Compilation'], 3, 'Compilation is not an OOP feature.', 'easy', 35),
  q('oop', 'Method overloading is an example of?', ['Compile-time polymorphism', 'Runtime polymorphism', 'Inheritance', 'Encapsulation'], 0, 'Overloading is resolved at compile time (static polymorphism).', 'medium', 55),
  q('oop', 'A constructor in a class is?', ['A method that deletes objects', 'A special method called when an object is created', 'A method to destroy objects', 'A static utility'], 1, 'Constructors initialize objects when they are created.', 'easy', 40),

  // Software Engineering
  q('software-engineering', 'Which phase comes first in the SDLC?', ['Testing', 'Requirements analysis', 'Coding', 'Maintenance'], 1, 'Requirements analysis begins the SDLC.', 'easy', 40),
  q('software-engineering', 'Agile methodology emphasizes?', ['Heavy documentation upfront', 'Incremental development and customer feedback', 'No testing', 'Waterfall phases only'], 1, 'Agile focuses on short iterations and continuous feedback.', 'medium', 50),
  q('software-engineering', 'Unit testing tests?', ['The whole system', 'Individual components or functions', 'The user interface only', 'Database only'], 1, 'Unit tests verify individual units of code.', 'easy', 45),
  q('software-engineering', 'Which of the following is a version control system?', ['Git', 'Jira', 'Selenium', 'Docker'], 0, 'Git is a version control system.', 'easy', 35),

  // Computer Fundamentals
  q('computer-fundamentals', 'Which number system does a computer use internally?', ['Decimal', 'Binary', 'Octal', 'Hexadecimal'], 1, 'Computers use the binary system (0 and 1).', 'easy', 35),
  q('computer-fundamentals', '1 KB equals how many bytes?', ['100 bytes', '512 bytes', '1024 bytes', '2048 bytes'], 2, '1 KB = 1024 bytes.', 'easy', 35),
  q('computer-fundamentals', 'Which of these is an output device?', ['Keyboard', 'Monitor', 'Mouse', 'Scanner'], 1, 'A monitor displays output.', 'easy', 30),
  q('computer-fundamentals', 'RAM stands for?', ['Random Access Memory', 'Read Access Memory', 'Run Access Module', 'Random Applied Memory'], 0, 'RAM = Random Access Memory.', 'easy', 30),
  q('computer-fundamentals', 'The binary equivalent of decimal 5 is?', ['101', '100', '110', '011'], 0, '5 in binary = 101 (4+1).', 'easy', 40),

  // Data Structures
  q('data-structures', 'Which data structure uses FIFO?', ['Stack', 'Queue', 'Tree', 'Graph'], 1, 'A queue follows First-In-First-Out.', 'easy', 35),
  q('data-structures', 'Which data structure uses LIFO?', ['Queue', 'Stack', 'Array', 'Hash map'], 1, 'A stack follows Last-In-First-Out.', 'easy', 35),
  q('data-structures', 'The average-case time complexity of binary search is?', ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], 1, 'Binary search halves the search space each step: O(log n).', 'medium', 50),
  q('data-structures', 'The time complexity of accessing an element in a hash map is typically?', ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'], 2, 'Average-case hash map access is O(1).', 'medium', 50),
  q('data-structures', 'Mergesort has a worst-case time complexity of?', ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'], 1, 'Mergesort runs in O(n log n) in all cases.', 'medium', 50),
];
