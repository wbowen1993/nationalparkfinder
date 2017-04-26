#include "csvParser.h"
#include <iostream>
#include <string>
#include <vector>


static const char* NP_FILENAME = "../../../data/np_final.json";
static const char* NP_ACTIVITIES_FILENAME = "../../../data/NPActivitiesTable.csv";
static const char* NP_VISITOR_CENTERS_FILENAME = "../../../data/NPVisitorCenterTable.csv";

struct NP
{
	char m_npId[CSVIterator::MAX_CELL_LEN];
	char m_npName[CSVIterator::MAX_CELL_LEN];
	char m_GPSLat[CSVIterator::MAX_CELL_LEN];
	char m_GPSLong[CSVIterator::MAX_CELL_LEN];
<<<<<<< HEAD
};

static void toLowerCase(char* b)
=======

	struct GpsAabb
	{
		GpsAabb(double minGpsLat, double maxGpsLat, double minGpsLong, double maxGpsLong) :
		m_minGPSLat(minGpsLat), m_maxGPSLat(maxGpsLat), m_minGPSLong(minGpsLong), m_maxGPSLong(maxGpsLong)
		{}
		bool isInside(double gpsLat, double gpsLong)
		{
			return (m_minGPSLat <= gpsLat && gpsLat <= m_maxGPSLat) &&
				(m_minGPSLong <= gpsLong && gpsLong <= m_maxGPSLong);
		}
		double m_minGPSLat;	double m_maxGPSLat;
		double m_minGPSLong; double m_maxGPSLong;
	};

	static void parseFromJSON(const char* filename, std::vector<NP>& nationalParks)
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
				char* cursor = strstr(data, sId.c_str());

				while (cursor != NULL)
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

	static int validate(std::vector<NP>& nps, std::vector<NP::GpsAabb>& aabbs)
	{
		int numErrors = 0;
		// 1) Check np ids are # and unique.
		{
			bool npIdsAreAllNums = true;
			for (int i = 0; i < nps.size(); i++)
			{
				if (!Utils::stringHasOnlyDigit(nps[i].m_npId))
				{
					npIdsAreAllNums = false;
					fprintf(stdout, "[ERROR] NP%02d: NPId %s is not well-formed\n", i, nps[i].m_npId);
					numErrors++;
				}
			}
			for (int i = 0; i < nps.size(); i++)
			{
				int npId = atoi(nps[i].m_npId);
				for (int j = i + 1; j < nps.size(); j++)
				{
					int lhsNpId = atoi(nps[j].m_npId);
					if (i != j && npId == lhsNpId)
					{
						fprintf(stdout, "[ERROR] NP%02d (%s) and NP%02d (%s) share the same NPId: %s\n", i, nps[i].m_npName, j, nps[j].m_npName, nps[i].m_npId);
						numErrors++;
					}
				}
			}
		}
		// 2) Check names only contain readable characters.
		for (int i = 0; i < nps.size(); i++)
		{
			if (!Utils::stringIsLegalText(nps[i].m_npName))
			{
				fprintf(stdout, "[ERROR] NP%02d: The given name is not strictly text: %s\n", i, nps[i].m_npName);
				numErrors++;
			}
		}
		// 3) Check Longitude/Latitude are in one of the GPSAAbbs
		for (int i = 0; i < nps.size(); i++)
		{
			double npLat = atof(nps[i].m_GPSLat); double npLong = atof(nps[i].m_GPSLong);
			bool bInside = false;
			for (int j = 0; j < aabbs.size(); j++)
			{
				if (aabbs[j].isInside(npLat, npLong))
				{
					bInside = true;
					break;
				}
			}
			if (!bInside)
			{
				fprintf(stdout, "[ERROR] NP %d: GPS(%g, %g) is not within the general boundaries of NationalParks (Lat:[%g, %g], Long:[%g, %g])\n",
					i, npLat, npLong, aabbs[0].m_minGPSLat, aabbs[0].m_maxGPSLat, aabbs[0].m_minGPSLong, aabbs[0].m_maxGPSLong);
				numErrors++;
			}
		}
		return numErrors;
	}
};

static int validateNpId(const std::vector<NP>& nps, char* m_npId, int& outNPId, bool& warningOut)
>>>>>>> 5b1f2f4a042c9e8b6a10675896991aef915ec2b7
{
	bool foundError = false;
	bool bNpIdhasLetter = Utils::stringHasChars(m_npId);
	bool bNpIdhasDigit = Utils::stringHasDigit(m_npId);
	outNPId = -1;
	if (bNpIdhasDigit && bNpIdhasLetter)
	{
		fprintf(stdout, "NPId %s is not well-formed", m_npId);
		foundError = true;
	}
	else if (bNpIdhasDigit)
	{
		int myNpId = atoi(m_npId);
		for (int i = 0; i < nps.size(); i++)
		{
			int npId = atoi(nps[i].m_npId);
			if (myNpId == npId)
			{
				outNPId = i;
				break;
			}
		}
		if (outNPId == -1)
		{
			foundError = true;
		}
	}
	else if (bNpIdhasLetter) // If it is a word, convert it to an actual #id.
	{
		foundError = true;
		int minDiff = INT_MAX;

		char myNPName[CSVIterator::MAX_CELL_LEN];
		{
			strcpy_s(myNPName, CSVIterator::MAX_CELL_LEN, m_npId);

			Utils::toLowerCase(myNPName);
			Utils::removeWord(myNPName, " national");
			Utils::removeWord(myNPName, " park");
		}
		for (int i = 0; i < nps.size(); i++)
		{
<<<<<<< HEAD
			*np = np[wordLen];
			np++;
=======
			char npName[CSVIterator::MAX_CELL_LEN];
			strcpy_s(npName, CSVIterator::MAX_CELL_LEN, nps[i].m_npName);

			Utils::toLowerCase(npName);
			Utils::removeWord(npName, " national");
			Utils::removeWord(npName, " park");

			int diff = abs(_stricmp(myNPName, npName));
			if (diff < minDiff)
			{
				minDiff = diff;
				outNPId = i;
				warningOut = true;
				foundError = false;
			}
>>>>>>> 5b1f2f4a042c9e8b6a10675896991aef915ec2b7
		}
	}

	return foundError;
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

	char* print()
	{
		static char outBuffer[65534];
		_snprintf(outBuffer, 65534, "%s,%s,%s,%s,%s,%s\n", m_nPId, m_name, m_type, m_GPSLat, m_GPSLong, m_description);

		return outBuffer;
	}

	static void parseFromCSV(const char* filename, std::vector<NPActivity>& activities)
	{
		int fieldIdx = 0;
		NPActivity activity;
		for (CSVIterator csvIt(filename); !csvIt.end(); csvIt.nextCell())
		{
			fieldIdx = fieldIdx % NPActivity::NUM_FIELDS;
			switch (fieldIdx)
			{
<<<<<<< HEAD
				if ('0' <= m_nPId[i] && m_nPId[i] <= '9')
=======
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
		}
	}
	int validate(int activityId, const std::vector<NP>& nps, std::vector<NP::GpsAabb>& aabbs, bool modificationsAllowed)
	{
		int numErrors = 0;
		// Validate npid.
		int bestNPMatchIdx = -1; bool hasWarning = false;
		numErrors += validateNpId(nps, m_nPId, bestNPMatchIdx, hasWarning);
		{
			if (numErrors)
			{
				fprintf(stdout, "[ERROR] Activity %d: Did not find corresponding park based on npId %s given\n", activityId, m_nPId);
				if (modificationsAllowed && bestNPMatchIdx != -1)
				{
					strcpy(m_nPId, nps[bestNPMatchIdx].m_npId);
				}
			}
			if (hasWarning)
			{
				fprintf(stdout, "[WARNING] Activity %d: Replaced npId %s by %s\n", activityId, m_nPId, nps[bestNPMatchIdx].m_npId);
				if (modificationsAllowed && bestNPMatchIdx != -1)
>>>>>>> 5b1f2f4a042c9e8b6a10675896991aef915ec2b7
				{
					strcpy(m_nPId, nps[bestNPMatchIdx].m_npId);
				}
			}
		}
		//Validate activity name
		{
			if (!Utils::stringIsLegalText(m_name))
			{
				fprintf(stdout, "Activity %d: The given name is not strictly text: %s\n", activityId, m_name);
				numErrors++;
			}
		}
		//Validate activity type
		{
			std::vector<std::string> activityTypes;
			activityTypes.push_back("Hike"); activityTypes.push_back("Bike"); activityTypes.push_back("Viewpoint");
			activityTypes.push_back("Drive"); activityTypes.push_back("Boat"); activityTypes.push_back("Ski"); activityTypes.push_back("Climb");
			activityTypes.push_back("Canoe"); activityTypes.push_back("Fishing");
			bool foundActivityType = false;
			for (int i = 0; i < activityTypes.size(); i++)
			{
				if (strcmp(m_type, activityTypes[i].c_str()) == 0)
				{
					foundActivityType = true;
					break;
				}
			}
			if (!foundActivityType)
			{
<<<<<<< HEAD
				fprintf(stdout, "NPId %s is not well-formed", m_nPId);
			}
			else if (bNpIdhasLetter)
=======
				fprintf(stdout, "[ERROR] Activity %d: The given activity type is not recognized %s\n", activityId, m_type);
			}
		}
		//Validate activity description
		{
			if (!Utils::stringIsLegalText(m_description))
			{
				fprintf(stdout, "[ERROR] Activity %d: The given description is not strictly text: %s\n", activityId, m_description);
				numErrors++;
			}
		}
		//Validate GPS coordinates
		{
			if (bestNPMatchIdx != -1)
>>>>>>> 5b1f2f4a042c9e8b6a10675896991aef915ec2b7
			{
				double myNpLat = atof(m_GPSLat); double myNpLong = atof(m_GPSLong);
				double npLat = atof(nps[bestNPMatchIdx].m_GPSLat); double npLong = atof(nps[bestNPMatchIdx].m_GPSLong);
				double diffLat = abs(myNpLat - npLat); double diffLong = abs(myNpLong - npLong);
				if (diffLat > 2.0 || diffLong > 2.0)
				{
<<<<<<< HEAD
					strcpy_s(myNPName, CSVIterator::MAX_CELL_LEN, m_nPId);

					toLowerCase(myNPName);
					removeWord(myNPName, " national");
					removeWord(myNPName, " park");
=======
					fprintf(stdout, "[ERROR] Activity %d: GPS(%g, %g) is not within 2.0 lat./long. unit of its NationalPark (Name: %s, GPS(%g, %g)\n",
						activityId, myNpLat, myNpLong, nps[bestNPMatchIdx].m_npName, npLat, npLong);
					numErrors++;
>>>>>>> 5b1f2f4a042c9e8b6a10675896991aef915ec2b7
				}
			}
			else
			{
				double npLat = atof(m_GPSLat); double npLong = atof(m_GPSLong);
				bool bInside = false;
				for (int j = 0; j < aabbs.size(); j++)
				{
					if (aabbs[j].isInside(npLat, npLong))
					{
						bInside = true;
						break;
					}
				}
<<<<<<< HEAD
				

=======
				if (!bInside)
				{
					fprintf(stdout, "[ERROR] Activity %d: GPS(%g, %g) is not within the general boundaries of NationalParks (Lat:[%g, %g], Long:[%g, %g])\n",
						activityId, npLat, npLong, aabbs[0].m_minGPSLat, aabbs[0].m_maxGPSLat, aabbs[0].m_minGPSLong, aabbs[0].m_maxGPSLong);
					numErrors++;
				}
>>>>>>> 5b1f2f4a042c9e8b6a10675896991aef915ec2b7
			}
		}
		return numErrors;
	}
};

struct NPVisitorCenter
{
	static const int NUM_FIELDS = 6;
	char m_npId[CSVIterator::MAX_CELL_LEN];
	char m_name[CSVIterator::MAX_CELL_LEN];
	char m_phone[CSVIterator::MAX_CELL_LEN];
	char m_website[CSVIterator::MAX_CELL_LEN];
	char m_gpsLat[CSVIterator::MAX_CELL_LEN];
	char m_gpsLong[CSVIterator::MAX_CELL_LEN];

	char* print()
	{
		static char outBuffer[65534];
		_snprintf(outBuffer, 65534, "%s,%s,%s,%s,%s,%s\n", m_npId, m_name, m_phone, m_website, m_gpsLat, m_gpsLong);

		return outBuffer;
	}

	static void parseFromCSV(const char* filename, std::vector<NPVisitorCenter>& vCenters)
	{
		int fieldIdx = 0;
		NPVisitorCenter vCenter;
		for (CSVIterator csvIt(filename); !csvIt.end(); csvIt.nextCell())
		{
			fieldIdx = fieldIdx % NPVisitorCenter::NUM_FIELDS;
			switch (fieldIdx)
			{
			case 0:
				strcpy_s(vCenter.m_npId, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 1:
				strcpy_s(vCenter.m_name, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 2:
				strcpy_s(vCenter.m_phone, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 3:
				strcpy_s(vCenter.m_website, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 4:
				strcpy_s(vCenter.m_gpsLat, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			case 5:
				strcpy_s(vCenter.m_gpsLong, CSVIterator::MAX_CELL_LEN * sizeof(char), csvIt.curCell());
				break;
			};
			fieldIdx++;

<<<<<<< HEAD
				NP newNP;
=======
			if (fieldIdx == NPVisitorCenter::NUM_FIELDS)
			{
				vCenters.push_back(vCenter);
			}
		}
	}
	int validate(int vCenterId, const std::vector<NP>& nps, std::vector<NP::GpsAabb>& aabbs, bool modificationsAllowed)
	{
		int numErrors = 0;
		// Validate npid.
		int bestNPMatchIdx = -1; bool hasWarning = false;
		numErrors += validateNpId(nps, m_npId, bestNPMatchIdx, hasWarning);
		{
			if (numErrors)
			{
				fprintf(stdout, "[ERROR] vCenter %d: Did not find corresponding park based on npId %s given\n", vCenterId, m_npId);
				if (modificationsAllowed && bestNPMatchIdx != -1)
				{
					strcpy(m_npId, nps[bestNPMatchIdx].m_npId);
				}
			}
			if (hasWarning)
			{
				fprintf(stdout, "[WARNING] vCenter %d: Replaced npId %s by %s\n", vCenterId, m_npId, nps[bestNPMatchIdx].m_npId);
				if (modificationsAllowed && bestNPMatchIdx != -1)
>>>>>>> 5b1f2f4a042c9e8b6a10675896991aef915ec2b7
				{
					strcpy(m_npId, nps[bestNPMatchIdx].m_npId);
				}
<<<<<<< HEAD
				{
					std::string sName("\"name\":");
					char* nextNpName = strstr(cursor, sName.c_str()) + sName.size();
					char* end = strstr(nextNpName, ",");
					strncpy_s(newNP.m_npName, CSVIterator::MAX_CELL_LEN, nextNpName + 1, (end - nextNpName - 2) * sizeof(char));
=======
			}
		}
		//Validate m_name
		{
			if (!Utils::stringIsLegalText(m_name))
			{
				fprintf(stdout, "[ERROR] vCenter %d: The given name is not strictly text: %s\n", vCenterId, m_name);
				numErrors++;
			}
		}
		//Validate m_phone
		{
			const int strLen = strlen(m_phone);
			int numDigits = 0;
			char phoneDigits[CSVIterator::MAX_CELL_LEN];
			for (int i = 0; i < strLen; i++)
			{
				if (!(m_phone[i] == '(' || m_phone[i] == ')' || m_phone[i] == ' ' || m_phone[i] == '-' || ('0' <= m_phone[i] && m_phone[i] <= '9')))
				{
					fprintf(stdout, "[ERROR] vCenter %d: phone %s given contains an unknow digit %c\n", vCenterId, m_phone, m_phone[i]);
					numErrors++;
>>>>>>> 5b1f2f4a042c9e8b6a10675896991aef915ec2b7
				}
				if ('0' <= m_phone[i] && m_phone[i] <= '9')
				{
					phoneDigits[numDigits] = m_phone[i];
					numDigits++;
				}
<<<<<<< HEAD
				{
					std::string sGPSLong("\"longitude\":");
					char* nextGPSLong = strstr(cursor, sGPSLong.c_str()) + sGPSLong.size();
					char* end = strstr(nextGPSLong, ",");
					strncpy_s(newNP.m_GPSLong, CSVIterator::MAX_CELL_LEN, nextGPSLong + 1, (end - nextGPSLong - 2) * sizeof(char));
=======
			}
			if (numDigits != 10)
			{
				fprintf(stdout, "[ERROR] vCenter %d: phone %s given contains does not contain 10 digits\n", vCenterId, m_phone);
				numErrors++;
			}
			else if (m_phone[0] != '(' || m_phone[4] != ')' || m_phone[5] != ' ' || m_phone[9] != '-')
			{
				char formattedPhone[CSVIterator::MAX_CELL_LEN];
				{
					int digitIdx = 0; int formatIdx = 0;
					formattedPhone[formatIdx++] = '(';
					for (; digitIdx < 3; digitIdx++) { formattedPhone[formatIdx++] = phoneDigits[digitIdx]; }
					formattedPhone[formatIdx++] = ')';
					formattedPhone[formatIdx++] = ' ';
					for (; digitIdx < 6; digitIdx++) { formattedPhone[formatIdx++] = phoneDigits[digitIdx]; }
					formattedPhone[formatIdx++] = '-';
					for (; digitIdx < 10; digitIdx++) { formattedPhone[formatIdx++] = phoneDigits[digitIdx]; }
					formattedPhone[formatIdx++] = '\0';
				}
				fprintf(stdout, "[WARNING] vCenter %d: phone %s was reformatted to %s\n", vCenterId, m_phone, formattedPhone);
				strcpy(m_phone, formattedPhone);
			}
		}
		//Validate m_website
		{
			if (!Utils::stringIsLegalText(m_website))
			{
				fprintf(stdout, "[ERROR] vCenter %d: The given website is not strictly text: %s\n", vCenterId, m_website);
				numErrors++;
			}
			if (strncmp(m_website, "https://www.", 12))
			{
				fprintf(stdout, "[ERROR] vCenter %d: %s website should start with https://www.\n", vCenterId, m_website);
				numErrors++;
			}
		}
		//Validate GPS coordinates
		{
			if (bestNPMatchIdx != -1)
			{
				double myNpLat = atof(m_gpsLat); double myNpLong = atof(m_gpsLong);
				double npLat = atof(nps[bestNPMatchIdx].m_GPSLat); double npLong = atof(nps[bestNPMatchIdx].m_GPSLong);
				double diffLat = abs(myNpLat - npLat); double diffLong = abs(myNpLong - npLong);
				if (diffLat > 2.0 || diffLong > 2.0)
				{
					fprintf(stdout, "[ERROR] vCenter %d: GPS(%g, %g) is not within 2.0 lat./long. unit of its NationalPark (Name: %s, GPS(%g, %g)\n",
						vCenterId, myNpLat, myNpLong, nps[bestNPMatchIdx].m_npName, npLat, npLong);
					numErrors++;
				}
			}
			else
			{
				double npLat = atof(m_gpsLat); double npLong = atof(m_gpsLong);
				bool bInside = false;
				for (int j = 0; j < aabbs.size(); j++)
				{
					if (aabbs[j].isInside(npLat, npLong))
					{
						bInside = true;
						break;
					}
				}
				if (!bInside)
				{
					fprintf(stdout, "[ERROR] vCenter %d: GPS(%g, %g) is not within the general boundaries of NationalParks (Lat:[%g, %g], Long:[%g, %g])\n",
						vCenterId, npLat, npLong, aabbs[0].m_minGPSLat, aabbs[0].m_maxGPSLat, aabbs[0].m_minGPSLong, aabbs[0].m_maxGPSLong);
					numErrors++;
>>>>>>> 5b1f2f4a042c9e8b6a10675896991aef915ec2b7
				}
			}
		}
		return numErrors;
	}
};

#include <sstream> 

int main()
{
	bool modificationsAllowed = true;
	// Input:
	std::vector<NP::GpsAabb> npsAabbs;
	{
		npsAabbs.push_back(NP::GpsAabb(18.0, 68, -160, -64));
		npsAabbs.push_back(NP::GpsAabb(-14.615274, -13.203847, -172.935832, -169.086727));
	}
	std::vector<NP> nps;
	NP::parseFromJSON(NP_FILENAME, nps);

	std::vector<NPActivity> activities;
	NPActivity::parseFromCSV(NP_ACTIVITIES_FILENAME, activities);

	std::vector<NPVisitorCenter> vCenters;
	NPVisitorCenter::parseFromCSV(NP_VISITOR_CENTERS_FILENAME, vCenters);

	// Output
	int numErrors = 0;
	numErrors += NP::validate(nps, npsAabbs);
	for (int i = 1; i < activities.size(); i++)
	{
		numErrors += activities[i].validate(i, nps, npsAabbs, modificationsAllowed);
	}
	for (int i = 1; i < vCenters.size(); i++)
	{
		numErrors += vCenters[i].validate(i, nps, npsAabbs, modificationsAllowed);
	}
	fprintf(stdout, "Found %d error(s).\n", numErrors);

	if (modificationsAllowed)
	{
		{
			FILE* fp1 = NULL;
			char newFilename[256]; strcpy_s(newFilename, 256, NP_ACTIVITIES_FILENAME);
			Utils::addTimeStamp(newFilename);
			errno_t errNo = fopen_s(&fp1, newFilename, "w+");
			if (fp1 == NULL)
			{
				printf("Oh dear, something went wrong with fopen()! %s\n", strerror(errNo));
			}
			std::string outData;
			for (int i = 1; i < activities.size(); i++)
			{
				outData += activities[i].print();
			}
			fwrite(outData.c_str(), sizeof(char), outData.size(), fp1);
			fclose(fp1);
		}
		{
			FILE* fp1 = NULL;
			char newFilename[256]; strcpy_s(newFilename, 256, NP_VISITOR_CENTERS_FILENAME);
			Utils::addTimeStamp(newFilename);
			errno_t errNo = fopen_s(&fp1, newFilename, "w+");
			if (fp1 == NULL)
			{
				printf("Oh dear, something went wrong with fopen()! %s\n", strerror(errNo));
			}
			std::string outData;
			for (int i = 1; i < vCenters.size(); i++)
			{
				outData += vCenters[i].print();
			}
			fwrite(outData.c_str(), sizeof(char), outData.size(), fp1);
			fclose(fp1);
		}
	}
}