#ifndef _CSV_PARSER_H_
#define _CSV_PARSER_H_

#include <string>

namespace Utils
{
	void toLowerCase(char* b);
	void removeWord(char* b, char* word);
	bool stringHasDigit(char* str);
	bool stringHasOnlyDigit(char* str);
	bool stringHasChars(char* str);
	bool stringIsLegalText(char* str);
	void addTimeStamp(char *buff);
};

class CSVIterator
{
public:
	static const int MAX_CELL_LEN = 32767;

	CSVIterator(const char* filename);
	~CSVIterator();

	void nextCell(); // Update cursor and return next cell content.
	char* curCell(); // return current cell content.
	bool end(); // Cursor has read all cells.

	static bool checkUniformNumFields(const char* filename, int numFields);

private:

	void cleanData(); // Remove ',' not separating any cells.

	char* m_cursor;
	char m_curCell[MAX_CELL_LEN];

	char* m_data;
	int m_dataLen;
};

#endif // _CSV_PARSER_H_