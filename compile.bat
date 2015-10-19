dir *.ts /s /b > ts_files.txt
call tsc @ts_files.txt -rootDir source\ -outDir distrib\
del ts_files.txt

