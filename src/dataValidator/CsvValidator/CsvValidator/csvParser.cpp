#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <time.h>

#include "csvParser.h"

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
				//printf("%c", csvIt.m_data[j]);
			}
			i = j + 1;
		}
	}
}

#define DTTMFMT "%Y-%m-%d_%H:%M:%S"
#define DTTMSZ 21
void addTimeStamp(char *buff)
{
	{
		char buff2[256];
		int i = 0;
		for (int j = 0; buff[i] != '\0'; i++)
		{
			buff2[j++] = buff[i];
			if (buff[i] == '/')
			{
				buff2[j++] = '/';
			}
		}
		buff2[i] = '\0';
		strcpy(buff, buff2);
	}

	char ext[64];
	int i = strlen(buff);
	for (; buff[i] != '.'; i--);
	strcpy_s(ext, 64*sizeof(char), &buff[i]);

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
	fopen_s(&fp, filename, "r");
	if (fp != NULL)
	{
		if (fseek(fp, 0, SEEK_END) == 0)
		{
			m_dataLen = ftell(fp);
			fseek(fp, 0, SEEK_SET);  //same as rewind(f);

			m_data = new char[m_dataLen + 1];
			size_t newFileLen = fread(m_data, sizeof(char), m_dataLen, fp);

			m_data[++newFileLen] = '\0';
			m_dataLen = strlen(m_data);
			m_cursor = m_data;
			//cleanData();

			char newFilename[256]; strcpy_s(newFilename, 256, filename);
			addTimeStamp(newFilename);
			FILE* fp1 = NULL;
			errno_t errNo = fopen_s(&fp1, "ABC.csv", "w+");
			printf("%s", strerror(errNo));
			fwrite(m_data, sizeof(char), m_dataLen, fp1);


			nextCell();
		}
	}
	else
	{
		fprintf(stderr, "Error reading %s", filename);
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

			if (*(m_cursor - 1) == ',' && *m_cursor == '\"')
			{
				nextCell = m_cursor + 1;
				while ((*nextCell != '\"') || *(nextCell + 1) != ',' && *(nextCell + 1) != '\n')
				{
					nextCell++;
				}
			}
			strncpy_s(m_curCell, MAX_CELL_LEN, m_cursor, (nextCell - m_cursor) * sizeof(char));
			//printf("%s\n", m_curCell);
			m_cursor = nextCell + 1;
			if (*m_cursor == ',' || *m_cursor == '\n') { m_cursor++;  }
		}
		else // Reached last cell
		{
			strncpy_s(m_curCell, MAX_CELL_LEN, m_cursor, (&m_data[m_dataLen] - m_cursor) * sizeof(char));
			m_cursor = NULL;

		}
	}
}

char* CSVIterator::curCell()
{
	return m_curCell;
}

bool CSVIterator::end()
{
	return (m_cursor == NULL);
}