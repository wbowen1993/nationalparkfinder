#include "csvParser.h"
#include <iostream>
#include <vector>


struct NP
{
	char m_npId[CSVIterator::MAX_CELL_LEN];
	char m_npName[CSVIterator::MAX_CELL_LEN];
	char m_GPSLat[CSVIterator::MAX_CELL_LEN];
	char m_GPSLong[CSVIterator::MAX_CELL_LEN];
};

static void toLowerCase(char* b)
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

static void removeWord(char* b, char* word)
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

struct NPActivity
{
	static const int NUM_FIELDS = 6;
	char m_nPId[CSVIterator::MAX_CELL_LEN];
	char m_name[CSVIterator::MAX_CELL_LEN];
	char m_type[CSVIterator::MAX_CELL_LEN];
	char m_GPSLat[CSVIterator::MAX_CELL_LEN];
	char m_GPSLong[CSVIterator::MAX_CELL_LEN];
	char m_description[CSVIterator::MAX_CELL_LEN];

	bool validate(int activityId, const std::vector<NP>& nps)
	{
		// If the npid is a word, convert it to an actual #id.
		{
			int idLen = strlen(m_nPId);
			bool bNpIdhasLetter = false; bool bNpIdhasDigit = false;
			for (int i = 0; i < idLen; i++)
			{
				if ('0' <= m_nPId[i] && m_nPId[i] <= '9')
				{
					bNpIdhasDigit = true;
				}
				else if ( ('a' <= m_nPId[i] && m_nPId[i] <= 'z') || ( 'A' <= m_nPId[i] && m_nPId[i] <= 'Z' ) )
				{
					bNpIdhasLetter = true;
				}
			}
			if (bNpIdhasDigit && bNpIdhasLetter)
			{
				fprintf(stdout, "NPId %s is not well-formed", m_nPId);
			}
			else if (bNpIdhasLetter)
			{
				int bestNPMatchIdx = -1;
				int minDiff = INT_MAX;

				char myNPName[CSVIterator::MAX_CELL_LEN];
				{
					strcpy_s(myNPName, CSVIterator::MAX_CELL_LEN, m_nPId);

					toLowerCase(myNPName);
					removeWord(myNPName, " national");
					removeWord(myNPName, " park");
				}
				for (int i = 0; i < nps.size(); i++)
				{
					char npName[CSVIterator::MAX_CELL_LEN];
					strcpy_s(npName, CSVIterator::MAX_CELL_LEN, nps[i].m_npName);

					toLowerCase(npName);
					removeWord(npName, " national");
					removeWord(npName, " park");

					int diff = abs( _stricmp(myNPName, npName) );
					if (diff < minDiff)
					{
						minDiff = diff;
						bestNPMatchIdx = i;
					}
				}
				

			}
		}
		

		double fGPSLat = atof(m_GPSLat); double fGPSLong = atof(m_GPSLong);
		return true;
	}
};


void parseNationalParksFromJSON(const char* filename, std::vector<NP>& nationalParks)
{
	FILE* fp = NULL;
	fopen_s(&fp, filename, "r");
	if (fp != NULL)
	{
		if (fseek(fp, 0, SEEK_END) == 0)
		{
			long dataLen = ftell(fp);
			fseek(fp, 0, SEEK_SET);  //same as rewind(f);

			char* data = new char[dataLen + 1];
			size_t newFileLen = fread(data, sizeof(char), dataLen, fp);

			data[++newFileLen] = '\0';
			
			std::string sId("\"id\":");
			char* cursor = data;
			
			while ( cursor != NULL )
			{
				cursor += sId.size();

				NP newNP;
				{
					char* end = strstr(cursor, ",");
					strncpy_s(newNP.m_npId, CSVIterator::MAX_CELL_LEN, cursor, (end - cursor) * sizeof(char));
				}
				{
					std::string sName("\"name\":");
					char* nextNpName = strstr(cursor, sName.c_str()) + sName.size();
					char* end = strstr(nextNpName, ",");
					strncpy_s(newNP.m_npName, CSVIterator::MAX_CELL_LEN, nextNpName + 1, (end - nextNpName - 2) * sizeof(char));
				}
				{
					std::string sGPSLat("\"latitude\":");
					char* nextGPSLat = strstr(cursor, sGPSLat.c_str()) + sGPSLat.size();
					char* end = strstr(nextGPSLat, ",");
					strncpy_s(newNP.m_GPSLat, CSVIterator::MAX_CELL_LEN, nextGPSLat + 1, (end - nextGPSLat - 2) * sizeof(char));
				}
				{
					std::string sGPSLong("\"longitude\":");
					char* nextGPSLong = strstr(cursor, sGPSLong.c_str()) + sGPSLong.size();
					char* end = strstr(nextGPSLong, ",");
					strncpy_s(newNP.m_GPSLong, CSVIterator::MAX_CELL_LEN, nextGPSLong + 1, (end - nextGPSLong - 2) * sizeof(char));
				}
				nationalParks.push_back(newNP);
				cursor = strstr(cursor + 1, sId.c_str());
			}
			delete[] data;
		}
	}
	else
	{
		fprintf(stderr, "Error reading %s", filename);
	}
}


#include <sstream> 

int main()
{
	std::vector<NP> nps;
	parseNationalParksFromJSON("../../../data/np_final.json", nps);

	int fieldIdx = 0;
	std::vector<NPActivity> activities;

	NPActivity activity;
	for (CSVIterator csvIt("../../../data/NPActivitiesTable.csv"); !csvIt.end(); csvIt.nextCell())
	{
		switch (fieldIdx)
		{
			case 0:
				strcpy_s(activity.m_nPId, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 1:
				strcpy_s(activity.m_name, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 2:
				strcpy_s(activity.m_type, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 3:
				strcpy_s(activity.m_GPSLat, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 4:
				strcpy_s(activity.m_GPSLong, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 5:
				strcpy_s(activity.m_description, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
		};
		fieldIdx++;

		if (fieldIdx == NPActivity::NUM_FIELDS)
		{
			activities.push_back(activity);
		}
		//std::cout << fieldIdx << ": " << csvIt.curCell() << "\n";
	}
	for (int i = 1; i < activities.size(); i++)
	{
		activities[i].validate(i, nps);
	}
}
