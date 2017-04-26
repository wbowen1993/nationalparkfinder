#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <time.h>

#include "csvParser.h"

void Utils::toLowerCase(char* b)
{
	int c = 0;
	while (b[c] != '\0')
	{
		if ('A' <= b[c] && b[c] <= 'Z')
		{
			b[c] += 'a' - 'A';
		}
		++c;
	}
}

void  Utils::removeWord(char* b, char* word)
{
	const int wordLen = strlen(word);
	char* np = strstr(b, word);
	if (np)
	{
		while (*np)
		{
			*np = np[wordLen];
			np++;
		}
	}
}

bool Utils::stringHasDigit(char* str)
{
	int strLen = strlen(str);
	bool strHasDigit = false;
	for (int i = 0; i < strLen; i++)
	{
		if ('0' <= str[i] && str[i] <= '9')
		{
			strHasDigit = true;
			break;
		}
	}
	return strHasDigit;
}

bool Utils::stringHasOnlyDigit(char* str)
{
	int strLen = strlen(str);
	bool strHasOnlyDigits = true;
	for (int i = 0; i < strLen; i++)
	{
		if (!('0' <= str[i] && str[i] <= '9'))
		{
			strHasOnlyDigits = false;
			break;
		}
	}
	return strHasOnlyDigits;
}

bool Utils::stringHasChars(char* str)
{
	int strLen = strlen(str);
	bool strHasChars = false;
	for (int i = 0; i < strLen; i++)
	{
		if (('a' <= str[i] && str[i] <= 'z') || ('A' <= str[i] && str[i] <= 'Z'))
		{
			strHasChars = true;
			break;
		}
	}
	return strHasChars;
}

bool Utils::stringIsLegalText(char* str)
{
	int strLen = strlen(str);
	for (int i = 0; i < strLen; i++)
	{
		if (str[i] < ' ' || str[i] >= 127)
		{
			return false;
		}
	}
	return true;
}

#define DTTMFMT "_%H_%M_%S" // "%Y-%m-%d_%H:%M:%S"
#define DTTMSZ 21
void Utils::addTimeStamp(char *buff)
{
	{
		char buff2[256];
		int j = 0;
		for (int i = 0; buff[i] != '\0'; i++)
		{
			buff2[j++] = buff[i];
			if (buff[i] == '\\')
			{
				buff2[j++] = '\\';
			}
		}
		buff2[j] = '\0';
		strcpy(buff, buff2);
	}

	char ext[64];
	int i = strlen(buff);
	for (; buff[i] != '.'; i--);
	strcpy_s(ext, 64 * sizeof(char), &buff[i]);

	time_t t = time(0);
	struct tm buf;
	localtime_s(&buf, &t);

	strftime(&buff[i], DTTMSZ, DTTMFMT, &buf);
	strcpy(buff + strlen(buff), ext);
}


CSVIterator::CSVIterator(const char* filename) :
m_cursor(NULL), m_data(NULL), m_dataLen(0)
{
	FILE* fp = NULL;
	errno_t errNo = fopen_s(&fp, filename, "r");
	if (fp != NULL)
	{
		if (fseek(fp, 0, SEEK_END) == 0)
		{
			m_dataLen = ftell(fp);
			fseek(fp, 0, SEEK_SET);  //same as rewind(f);

			m_data = new char[m_dataLen + 1];
			size_t newFileLen = fread(m_data, sizeof(char), m_dataLen, fp);

			m_data[newFileLen] = '\0';
			m_dataLen = strlen(m_data);
			m_cursor = m_data;

			nextCell();
		}
		fclose(fp);
	}
	else
	{
		fprintf(stderr, "Error reading %s (%s)", filename, strerror(errNo));
	}
}

CSVIterator::~CSVIterator()
{
	delete m_data;
}

void CSVIterator::nextCell()
{
	if (m_cursor != NULL)
	{
		char* nextComma = strstr(m_cursor, ",");
		char* nextNL = strstr(m_cursor, "\n");
		char* nextCell = (nextNL > nextComma) ? nextComma : nextNL;
		if (nextCell != NULL)
		{
			static int iter = 0;
			iter++;
			if (*(m_cursor - 1) == ',' && *m_cursor == '\"')
			{
				nextCell = m_cursor + 1;
				while ((*nextCell != '\"') || *(nextCell + 1) != ',' && *(nextCell + 1) != '\n')
				{
					nextCell++;
				}
			}
			if (*nextCell == '\"')
				strncpy_s(m_curCell, MAX_CELL_LEN, m_cursor, (nextCell + 1 - m_cursor) * sizeof(char));
			else
				strncpy_s(m_curCell, MAX_CELL_LEN, m_cursor, (nextCell - m_cursor) * sizeof(char));
			//printf("%s\n", m_curCell);
			m_cursor = nextCell + 1;
			if (*m_cursor == ',' || *m_cursor == '\n') { m_cursor++; }
		}
		else // Reached last cell
		{
			char* endOfFile = &m_data[m_dataLen];
			nextCell = (endOfFile > nextNL) ? nextNL : endOfFile;
			strncpy_s(m_curCell, MAX_CELL_LEN, m_cursor, (nextCell - m_cursor) * sizeof(char));
			m_cursor = NULL;
		}
	}
	else
	{
		m_curCell[0] = '\0';
	}
}

char* CSVIterator::curCell()
{
	return m_curCell;
}

bool CSVIterator::end()
{
	return (m_curCell[0] == '\0');
}

void CSVIterator::cleanData()
{
	for (int i = 0; i < m_dataLen; i++)
	{
		if (m_data[i] == ',' && m_data[i + 1] == '\"')
		{
			int j = i + 2;
			while ((m_data[j] != '\"') || (m_data[j + 1] != ',' && m_data[j + 1] != '\n'))
			{
				j++;
				if (m_data[j] == ',')
				{
					m_data[j] = ' ';
				}
			}
			i = j + 1;
		}
	}
}